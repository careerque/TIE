import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(env_path)

smtp_host = os.getenv("SMTP_HOST")
smtp_port = os.getenv("SMTP_PORT")
smtp_user = os.getenv("SMTP_USER")
smtp_pass = os.getenv("SMTP_PASSWORD")
smtp_from = os.getenv("SMTP_FROM", smtp_user)

print(f"SMTP CONFIG:")
print(f"Host: {smtp_host}")
print(f"Port: {smtp_port}")
print(f"User: {smtp_user}")
print(f"Pass: {smtp_pass}")
print(f"From: {smtp_from}")

if not all([smtp_host, smtp_port, smtp_user, smtp_pass]):
    print("Error: Missing env variables!")
    exit(1)

try:
    to_email = "techwolfcreation2@gmail.com" # send to self to test
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "SMTP Test"
    msg["From"] = smtp_from
    msg["To"] = to_email
    msg.attach(MIMEText("This is a test email.", "plain"))

    port = int(smtp_port)
    if port == 465:
        print("Connecting via SSL (port 465)...")
        server = smtplib.SMTP_SSL(smtp_host, port)
    else:
        print(f"Connecting via SMTP (port {port})...")
        server = smtplib.SMTP(smtp_host, port)
        print("Starting TLS...")
        server.starttls()

    print("Logging in...")
    # Try logging in with the password as-is
    server.login(smtp_user, smtp_pass)
    print("Sending mail...")
    server.sendmail(smtp_from, [to_email], msg.as_string())
    server.quit()
    print("SUCCESS: SMTP test completed!")
except Exception as e:
    print(f"ERROR: {e}")
