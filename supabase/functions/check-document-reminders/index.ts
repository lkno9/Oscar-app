import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Document {
  id: string;
  user_id: string;
  name: string;
  expiration_date: string;
  reminder_enabled: boolean;
  document_type: string;
}

interface ReminderToSend {
  userId: string;
  documentId: string;
  documentName: string;
  documentType: string;
  daysUntilExpiry: number;
  reminderType: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting document reminders check...");

    // Get all documents with expiration date and reminders enabled
    const { data: documents, error: docsError } = await supabase
      .from("documents")
      .select("id, user_id, name, expiration_date, reminder_enabled, document_type")
      .eq("reminder_enabled", true)
      .not("expiration_date", "is", null);

    if (docsError) {
      console.error("Error fetching documents:", docsError);
      throw docsError;
    }

    console.log(`Found ${documents?.length || 0} documents with expiration dates`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const remindersToSend: ReminderToSend[] = [];

    for (const doc of documents || []) {
      const expDate = new Date(doc.expiration_date);
      expDate.setHours(0, 0, 0, 0);
      const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Determine reminder type based on days until expiry
      let reminderType: string | null = null;
      if (daysUntilExpiry === 30) reminderType = "30_days";
      else if (daysUntilExpiry === 7) reminderType = "7_days";
      else if (daysUntilExpiry === 1) reminderType = "1_day";
      else if (daysUntilExpiry === 0) reminderType = "expired";
      else if (daysUntilExpiry < 0 && daysUntilExpiry >= -7 && daysUntilExpiry % 7 === 0) reminderType = "expired_weekly";

      if (!reminderType) continue;

      // Check if reminder already sent
      const { data: existingReminder } = await supabase
        .from("document_reminders")
        .select("id")
        .eq("document_id", doc.id)
        .eq("reminder_type", reminderType)
        .eq("is_sent", true)
        .single();

      if (existingReminder) {
        console.log(`Reminder ${reminderType} already sent for document ${doc.id}`);
        continue;
      }

      remindersToSend.push({
        userId: doc.user_id,
        documentId: doc.id,
        documentName: doc.name,
        documentType: doc.document_type || "document",
        daysUntilExpiry,
        reminderType,
      });
    }

    console.log(`${remindersToSend.length} reminders to send`);

    // Process each reminder
    for (const reminder of remindersToSend) {
      try {
        // Create reminder record
        await supabase.from("document_reminders").insert({
          user_id: reminder.userId,
          document_id: reminder.documentId,
          reminder_date: today.toISOString().split("T")[0],
          reminder_type: reminder.reminderType,
          is_sent: true,
          sent_at: new Date().toISOString(),
        });

        // Create in-app notification for the user
        let notifTitle = "";
        let notifMessage = "";
        
        if (reminder.daysUntilExpiry > 0) {
          notifTitle = "Document à renouveler";
          notifMessage = `Votre ${reminder.documentName} expire dans ${reminder.daysUntilExpiry} jour${reminder.daysUntilExpiry > 1 ? 's' : ''}`;
        } else if (reminder.daysUntilExpiry === 0) {
          notifTitle = "Document expiré aujourd'hui";
          notifMessage = `Votre ${reminder.documentName} expire aujourd'hui`;
        } else {
          notifTitle = "Document expiré";
          notifMessage = `Votre ${reminder.documentName} est expiré depuis ${Math.abs(reminder.daysUntilExpiry)} jour${Math.abs(reminder.daysUntilExpiry) > 1 ? 's' : ''}`;
        }

        await supabase.from("family_notifications").insert({
          user_id: reminder.userId,
          type: "document_expiration",
          title: notifTitle,
          message: notifMessage,
          senior_id: reminder.userId,
        });

        // Get family members linked to this user
        const { data: familyLinks } = await supabase
          .from("family_links")
          .select("family_member_id")
          .eq("senior_id", reminder.userId)
          .eq("status", "accepted");

        // Notify family members
        for (const link of familyLinks || []) {
          // Create in-app notification for family member
          await supabase.from("family_notifications").insert({
            user_id: link.family_member_id,
            type: "document_expiration",
            title: notifTitle,
            message: notifMessage,
            senior_id: reminder.userId,
          });

          // Send Email/SMS via send-family-notification edge function
          try {
            await supabase.functions.invoke("send-family-notification", {
              body: {
                recipientId: link.family_member_id,
                type: "document_expiration",
                title: notifTitle,
                message: notifMessage,
                seniorId: reminder.userId,
                documentName: reminder.documentName,
                daysUntilExpiry: reminder.daysUntilExpiry,
              },
            });
          } catch (notifError) {
            console.error(`Error sending notification to family member ${link.family_member_id}:`, notifError);
          }
        }

        // Also send notification to the senior themselves
        try {
          await supabase.functions.invoke("send-family-notification", {
            body: {
              recipientId: reminder.userId,
              type: "document_expiration",
              title: notifTitle,
              message: notifMessage,
              seniorId: reminder.userId,
              documentName: reminder.documentName,
              daysUntilExpiry: reminder.daysUntilExpiry,
            },
          });
        } catch (notifError) {
          console.error(`Error sending notification to senior ${reminder.userId}:`, notifError);
        }

        console.log(`Reminder sent for document ${reminder.documentId}`);
      } catch (reminderError) {
        console.error(`Error processing reminder for document ${reminder.documentId}:`, reminderError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        remindersProcessed: remindersToSend.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in check-document-reminders:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
