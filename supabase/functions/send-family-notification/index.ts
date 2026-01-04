import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Twilio configuration
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "message" | "mood" | "medication" | "event" | "alert" | "document_expiration";
  recipientId: string;
  senderName?: string;
  seniorName?: string;
  content?: string;
  moodLevel?: number;
  medicationName?: string;
  documentName?: string;
  daysUntilExpiry?: number;
}

const getSmsMessage = (notification: NotificationRequest): string => {
  const { type, senderName, seniorName, content, moodLevel, medicationName, documentName, daysUntilExpiry } = notification;
  
  switch (type) {
    case "message":
      return `📬 Oscar: Nouveau message de ${senderName || "un proche"}${content ? `: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"` : ''}`;
    
    case "mood":
      const moodEmoji = moodLevel ? ["😢", "😔", "😐", "🙂", "😄"][moodLevel - 1] : "😊";
      const moodText = moodLevel ? ["Très mal", "Pas bien", "Neutre", "Bien", "Très bien"][moodLevel - 1] : "Enregistrée";
      return `${moodEmoji} Oscar: ${seniorName || "Votre proche"} a enregistré son humeur: ${moodText}`;
    
    case "medication":
      return `💊 Oscar: ${seniorName || "Votre proche"} a ajouté un médicament: ${medicationName || "Nouveau médicament"}`;
    
    case "document_expiration":
      if (daysUntilExpiry !== undefined && daysUntilExpiry > 0) {
        return `📄 Oscar: ${documentName || "Un document"} de ${seniorName || "votre proche"} expire dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''}. Pensez à le renouveler.`;
      } else if (daysUntilExpiry === 0) {
        return `⚠️ Oscar: ${documentName || "Un document"} de ${seniorName || "votre proche"} expire aujourd'hui !`;
      } else {
        return `🚨 Oscar: ${documentName || "Un document"} de ${seniorName || "votre proche"} est expiré. Renouvellement urgent.`;
      }
    
    case "alert":
      return `🚨 ALERTE Oscar: ${content || `Alerte concernant ${seniorName || "votre proche"}`}`;
    
    default:
      return `📢 Oscar: Nouvelle notification concernant ${seniorName || "votre proche"}`;
  }
};

const sendSms = async (phoneNumber: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log("send-family-notification: Twilio not configured, skipping SMS");
    return { success: false, error: "Twilio not configured" };
  }

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    const body = new URLSearchParams({
      To: phoneNumber,
      From: TWILIO_PHONE_NUMBER,
      Body: message,
    });

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("send-family-notification: Twilio error:", data);
      return { success: false, error: data.message || "Failed to send SMS" };
    }

    console.log("send-family-notification: SMS sent successfully:", data.sid);
    return { success: true, sid: data.sid };
  } catch (error: any) {
    console.error("send-family-notification: SMS error:", error);
    return { success: false, error: error.message };
  }
};

const getEmailTemplate = (notification: NotificationRequest): { subject: string; html: string } => {
  const { type, senderName, seniorName, content, moodLevel, medicationName, documentName, daysUntilExpiry } = notification;
  
  const baseStyle = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
      .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
      .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
      .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      .emoji { font-size: 48px; margin-bottom: 10px; }
    </style>
  `;

  switch (type) {
    case "message":
      return {
        subject: `📬 Nouveau message de ${senderName || "un proche"}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="emoji">💬</div>
                <h1>Nouveau message</h1>
              </div>
              <div class="content">
                <p>Bonjour,</p>
                <p><strong>${senderName || "Un proche"}</strong> vous a envoyé un message :</p>
                <blockquote style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
                  ${content || "Message reçu"}
                </blockquote>
                <p>Connectez-vous à l'application pour répondre.</p>
              </div>
              <div class="footer">
                <p>Oscar - Votre compagnon au quotidien</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "mood":
      const moodEmoji = moodLevel ? ["😢", "😔", "😐", "🙂", "😄"][moodLevel - 1] : "😊";
      const moodText = moodLevel ? ["Très mal", "Pas bien", "Neutre", "Bien", "Très bien"][moodLevel - 1] : "Enregistrée";
      return {
        subject: `${moodEmoji} ${seniorName || "Votre proche"} a enregistré son humeur`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="emoji">${moodEmoji}</div>
                <h1>Humeur du jour</h1>
              </div>
              <div class="content">
                <p>Bonjour,</p>
                <p><strong>${seniorName || "Votre proche"}</strong> a enregistré son humeur du jour :</p>
                <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0;">
                  <span style="font-size: 64px;">${moodEmoji}</span>
                  <p style="font-size: 18px; font-weight: bold; margin-top: 10px;">${moodText}</p>
                </div>
                <p>Connectez-vous à l'application pour plus de détails.</p>
              </div>
              <div class="footer">
                <p>Oscar - Votre compagnon au quotidien</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "medication":
      return {
        subject: `💊 ${seniorName || "Votre proche"} a ajouté un médicament`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="emoji">💊</div>
                <h1>Nouveau médicament</h1>
              </div>
              <div class="content">
                <p>Bonjour,</p>
                <p><strong>${seniorName || "Votre proche"}</strong> a ajouté un nouveau médicament à son suivi :</p>
                <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0;">
                  <p style="font-size: 18px; font-weight: bold;">${medicationName || "Médicament"}</p>
                </div>
                <p>Connectez-vous à l'application pour voir les détails.</p>
              </div>
              <div class="footer">
                <p>Oscar - Votre compagnon au quotidien</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "document_expiration":
      const isExpired = daysUntilExpiry !== undefined && daysUntilExpiry <= 0;
      const isUrgent = daysUntilExpiry !== undefined && daysUntilExpiry <= 7;
      const headerColor = isExpired ? "background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);" : 
                          isUrgent ? "background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);" : "";
      const emoji = isExpired ? "🚨" : isUrgent ? "⚠️" : "📄";
      
      let expiryMessage = "";
      if (daysUntilExpiry !== undefined) {
        if (daysUntilExpiry > 0) {
          expiryMessage = `expire dans <strong>${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''}</strong>`;
        } else if (daysUntilExpiry === 0) {
          expiryMessage = `<strong>expire aujourd'hui</strong>`;
        } else {
          expiryMessage = `est <strong>expiré depuis ${Math.abs(daysUntilExpiry)} jour${Math.abs(daysUntilExpiry) > 1 ? 's' : ''}</strong>`;
        }
      }
      
      return {
        subject: `${emoji} Document à renouveler : ${documentName || "Document"}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="header" style="${headerColor}">
                <div class="emoji">${emoji}</div>
                <h1>Document à renouveler</h1>
              </div>
              <div class="content">
                <p>Bonjour,</p>
                <p>Le document <strong>${documentName || "Document"}</strong> de ${seniorName || "votre proche"} ${expiryMessage}.</p>
                <div style="padding: 20px; background: ${isExpired ? '#fef2f2' : isUrgent ? '#fff7ed' : '#f0fdf4'}; border: 1px solid ${isExpired ? '#fecaca' : isUrgent ? '#fed7aa' : '#bbf7d0'}; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <p style="font-size: 18px; font-weight: bold; margin: 0;">${documentName || "Document"}</p>
                  <p style="margin: 10px 0 0 0; color: ${isExpired ? '#dc2626' : isUrgent ? '#ea580c' : '#16a34a'};">
                    ${isExpired ? '⚠️ Renouvellement urgent' : isUrgent ? '⏰ À renouveler rapidement' : '📅 Pensez à le renouveler'}
                  </p>
                </div>
                <p>Connectez-vous à l'application pour gérer ce document ou demander l'aide d'Oscar.</p>
              </div>
              <div class="footer">
                <p>Oscar - Votre compagnon au quotidien</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "alert":
      return {
        subject: `🚨 Alerte concernant ${seniorName || "votre proche"}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                <div class="emoji">🚨</div>
                <h1>Alerte</h1>
              </div>
              <div class="content">
                <p>Bonjour,</p>
                <p>Une alerte a été déclenchée concernant <strong>${seniorName || "votre proche"}</strong> :</p>
                <div style="padding: 20px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin: 20px 0;">
                  <p>${content || "Veuillez vérifier son état."}</p>
                </div>
                <p>Connectez-vous à l'application ou contactez-le directement.</p>
              </div>
              <div class="footer">
                <p>Oscar - Votre compagnon au quotidien</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    default:
      return {
        subject: `📢 Notification Oscar`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyle}</head>
          <body>
            <div class="container">
              <div class="header">
                <div class="emoji">📢</div>
                <h1>Notification</h1>
              </div>
              <div class="content">
                <p>Bonjour,</p>
                <p>Vous avez reçu une nouvelle notification de l'application Oscar.</p>
                <p>Connectez-vous pour en savoir plus.</p>
              </div>
              <div class="footer">
                <p>Oscar - Votre compagnon au quotidien</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-family-notification: Request received");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const notification: NotificationRequest = await req.json();
    console.log("send-family-notification: Notification data:", notification);

    // Get recipient info from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name, phone_number, sms_notifications_enabled")
      .eq("id", notification.recipientId)
      .single();

    if (profileError) {
      console.log("send-family-notification: Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ success: false, message: "Profile not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { email?: any; sms?: any } = {};

    // Send email if email exists
    if (profile?.email) {
      console.log("send-family-notification: Sending email to:", profile.email);
      const { subject, html } = getEmailTemplate(notification);

      try {
        const emailResponse = await resend.emails.send({
          from: "Oscar <onboarding@resend.dev>",
          to: [profile.email],
          subject,
          html,
        });
        console.log("send-family-notification: Email sent successfully:", emailResponse);
        results.email = { success: true, id: emailResponse.data?.id };
      } catch (emailError: any) {
        console.error("send-family-notification: Email error:", emailError);
        results.email = { success: false, error: emailError.message };
      }
    } else {
      console.log("send-family-notification: No email found for recipient");
    }

    // Send SMS if phone number exists and SMS notifications are enabled
    // For alerts, always send SMS if phone is available
    if (profile?.phone_number && (profile?.sms_notifications_enabled || notification.type === "alert")) {
      console.log("send-family-notification: Sending SMS to:", profile.phone_number);
      const smsMessage = getSmsMessage(notification);
      const smsResult = await sendSms(profile.phone_number, smsMessage);
      results.sms = smsResult;
    } else {
      console.log("send-family-notification: SMS not sent - no phone or SMS disabled");
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("send-family-notification: Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
