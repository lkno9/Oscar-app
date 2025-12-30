import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "message" | "mood" | "medication" | "event" | "alert";
  recipientId: string;
  senderName?: string;
  seniorName?: string;
  content?: string;
  moodLevel?: number;
  medicationName?: string;
}

const getEmailTemplate = (notification: NotificationRequest): { subject: string; html: string } => {
  const { type, senderName, seniorName, content, moodLevel, medicationName } = notification;
  
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

    // Get recipient email from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", notification.recipientId)
      .single();

    if (profileError || !profile?.email) {
      console.log("send-family-notification: No email found for recipient:", notification.recipientId);
      return new Response(
        JSON.stringify({ success: false, message: "No email found for recipient" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("send-family-notification: Sending email to:", profile.email);

    const { subject, html } = getEmailTemplate(notification);

    const emailResponse = await resend.emails.send({
      from: "Oscar <onboarding@resend.dev>",
      to: [profile.email],
      subject,
      html,
    });

    console.log("send-family-notification: Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
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
