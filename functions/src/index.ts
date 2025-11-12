// import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';
// import sgMail from '@sendgrid/mail';

// // Initialize admin SDK
// admin.initializeApp();

// // Read SendGrid key from environment (set via `firebase functions:config:set sendgrid.key="KEY"` or via process.env)
// const SENDGRID_KEY = process.env.SENDGRID_API_KEY || functions.config().sendgrid?.key;
// if (SENDGRID_KEY) sgMail.setApiKey(SENDGRID_KEY);

// // Configuration
// const TIMEZONE = 'America/Sao_Paulo';
// // Runs monthly on the 1st at 02:00 (server timezone set below)
// const SCHEDULE_CRON = '0 2 1 * *';

// // How many days of retention before automatic deletion (optional fallback)
// const DEFAULT_RETENTION_DAYS = 365;

// function startOfPreviousMonth(reference = new Date()) {
//   const year = reference.getFullYear();
//   const month = reference.getMonth(); // 0-based
//   const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
//   return start;
// }

// function endOfPreviousMonth(reference = new Date()) {
//   const year = reference.getFullYear();
//   const month = reference.getMonth();
//   // day 0 of current month is last day of previous month
//   const end = new Date(year, month, 0, 23, 59, 59, 999);
//   return end;
// }

// // Helper: delete docs in batches (max 500 per batch)
// async function deleteDocsInBatches(docs: FirebaseFirestore.QueryDocumentSnapshot[]) {
//   const db = admin.firestore();
//   const BATCH_SIZE = 400; // keep under 500 for safety
//   let deleted = 0;
//   for (let i = 0; i < docs.length; i += BATCH_SIZE) {
//     const batch = db.batch();
//     const slice = docs.slice(i, i + BATCH_SIZE);
//     slice.forEach(d => batch.delete(d.ref));
//     await batch.commit();
//     deleted += slice.length;
//   }
//   return deleted;
// }

// export const monthlyAuditReportAndCleanup = functions.pubsub
//   .schedule(SCHEDULE_CRON)
//   .timeZone(TIMEZONE)
//   .onRun(async (context) => {
//     const db = admin.firestore();

//     // Determine period (previous month)
//     const start = startOfPreviousMonth();
//     const end = endOfPreviousMonth();
//     const startTs = admin.firestore.Timestamp.fromDate(start);
//     const endTs = admin.firestore.Timestamp.fromDate(end);

//     console.log(`Running monthlyAuditReportAndCleanup for ${start.toISOString()} -> ${end.toISOString()}`);

//     // Query logs from previous month
//     const query = db.collection('auditLogs')
//       .where('timestamp', '>=', startTs)
//       .where('timestamp', '<=', endTs);

//     const snapshot = await query.get();
//     const total = snapshot.size;
//     console.log(`Found ${total} audit log(s) for previous month`);

//     // Aggregate counts by collection and action
//     const summary: Record<string, number> = {};
//     const perUser: Record<string, number> = {};

//     snapshot.forEach(doc => {
//       const data = doc.data();
//       const collection = data.collection || 'unknown';
//       const action = data.action || 'unknown';
//       const key = `${collection}:${action}`;
//       summary[key] = (summary[key] || 0) + 1;

//       const uid = data.userId || 'unknown';
//       perUser[uid] = (perUser[uid] || 0) + 1;
//     });

//     // Build textual and HTML report
//     const monthLabel = start.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
//     let text = `Relatório de auditoria - ${monthLabel}\nTotal de eventos: ${total}\n\n`;
//     text += 'Por coleção:ação:\n';
//     Object.entries(summary).forEach(([k, v]) => { text += ` - ${k}: ${v}\n`; });
//     text += '\nPor usuário:\n';
//     Object.entries(perUser).forEach(([k, v]) => { text += ` - ${k}: ${v}\n`; });

//     // Prepare email
//     const to = process.env.AUDIT_EMAIL_TO || functions.config().audit?.email_to;
//     const from = process.env.AUDIT_EMAIL_FROM || functions.config().audit?.email_from;

//     if (!to || !from) {
//       console.warn('Audit report: missing email configuration (AUDIT_EMAIL_TO / AUDIT_EMAIL_FROM)');
//     } else if (!SENDGRID_KEY) {
//       console.warn('Audit report: SENDGRID API KEY is not configured; skipping email send');
//     } else {
//       const subject = `Relatório de auditoria: ${monthLabel} — ${total} eventos`;
//       const msg = {
//         to,
//         from,
//         subject,
//         text,
//       } as any;

//       try {
//         // Send email
//         await sgMail.send(msg);
//         console.log('Audit report email sent to', to);
//       } catch (err) {
//         console.error('Failed to send audit report email', err);
//       }
//     }

//     // Delete the logs we just summarized (in batches)
//     try {
//       const docs = snapshot.docs;
//       if (docs.length > 0) {
//         const deleted = await deleteDocsInBatches(docs);
//         console.log(`Deleted ${deleted} audit log documents from previous month`);
//       }
//     } catch (err) {
//       console.error('Error deleting audit logs after report', err);
//     }

//     return { success: true, processed: total };
//   });
