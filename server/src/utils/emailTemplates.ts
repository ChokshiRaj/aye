/**
 * Wraps email content inside the standard AYE branding HTML template.
 */
export function wrapInTemplate(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 20px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border: 1px solid #e2e8f0;
    }
    .header {
      background-color: #0f172a;
      padding: 24px;
      text-align: center;
    }
    .header-logo {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 0.1em;
      color: #ffffff;
      margin: 0;
    }
    .header-tagline {
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .content {
      padding: 32px 24px;
      line-height: 1.6;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .btn {
      display: inline-block;
      background-color: #dc2626;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
      padding: 12px 24px;
      border-radius: 6px;
      margin: 20px 0;
      text-align: center;
      transition: background-color 0.2s;
    }
    .btn:hover {
      background-color: #b91c1c;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 20px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .footer a {
      color: #dc2626;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="header-logo">AYE</h1>
        <div class="header-tagline">Personal Command Centre</div>
      </div>
      <div class="content">
        <h2 class="title">${title}</h2>
        ${bodyHtml}
      </div>
      <div class="footer">
        AYE Dashboard &bull; Manage email preferences in <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/settings">Settings</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
