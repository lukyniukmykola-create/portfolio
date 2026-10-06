from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from pypdf import PdfReader

base = Path(__file__).resolve().parent.parent
target = base / 'outputs' / 'Mykola-Lukyniuk-Resume.pdf'
c = canvas.Canvas(str(target), pagesize=A4, pageCompression=1)
c.setTitle('Mykola Lukyniuk - Software & Automation Profile')
c.setAuthor('Mykola Lukyniuk')
w, h = A4
margin = 44
width = w - margin * 2
y = h - 48
ink, grey, light = HexColor('#161616'), HexColor('#626262'), HexColor('#dedede')
styles = {
    'body': ParagraphStyle('Body', fontName='Helvetica', fontSize=10, leading=15, textColor=grey),
    'title': ParagraphStyle('Title', fontName='Helvetica-Bold', fontSize=11, leading=16, textColor=ink),
    'meta': ParagraphStyle('Meta', fontName='Helvetica', fontSize=8.5, leading=13, textColor=grey),
}

def para(text, style='body', space=0):
    global y
    p = Paragraph(text, styles[style])
    _, height = p.wrap(width, h)
    p.drawOn(c, margin, y - height)
    y -= height + space

def section(label):
    global y
    y -= 21
    c.setFillColor(ink)
    c.setFont('Helvetica-Bold', 8.5)
    c.drawString(margin, y, label)
    c.setStrokeColor(light)
    c.setLineWidth(.5)
    c.line(margin + 116, y + 3, w - margin, y + 3)
    y -= 19

c.setFillColor(ink)
c.rect(margin, y + 9, 26, 3, fill=1, stroke=0)
y -= 31
c.setFont('Helvetica-Bold', 31)
c.drawString(margin, y, 'Mykola Lukyniuk')
y -= 24
c.setFont('Helvetica', 13)
c.drawString(margin, y, 'Automation & Software Solutions Developer')
y -= 20
c.setFillColor(grey)
c.setFont('Helvetica', 9)
c.drawString(margin, y, 'Ivano-Frankivsk, Ukraine')
y -= 29
para('Engineering student building practical software for connected workflows: Python desktop applications, Telegram systems, API integrations and interactive technical visualization.')

section('SELECTED PROJECTS')
para('STEELON', 'title', 2)
para('Currency monitoring application with API updates, historical values in SQLite, a desktop interface and Telegram notifications.', space=4)
para('Python / APIs / SQLite / Desktop / Telegram', 'meta', 14)
para('Student Activity System', 'title', 2)
para('Telegram workflow for student tasks and participant submissions, with persistent SQLite records and activity statistics.', space=4)
para('Python / Telegram Bot API / SQLite / Automation', 'meta', 14)
para('3D Automation Models', 'title', 2)
para('Interactive technical models that make automation components and system relationships easier to explore.', space=4)
para('3D / Engineering / Interactive visualization', 'meta')

section('SKILLS & TOOLS')
para('<b>Software:</b> Python, desktop applications, web interfaces, Git.<br/><b>Connected systems:</b> APIs, Telegram Bot API, automation workflows.<br/><b>Data:</b> SQLite, PostgreSQL.<br/><b>Engineering:</b> automation systems, 3D models, technical visualization.')

section('EDUCATION & ACTIVITY')
para('Automation and Computer-Integrated Technologies', 'title', 2)
para('IFNTUOG - student', space=12)
para('Student self-government', 'title', 2)
para('Organizational and project work, collaboration and coordination of student activities.', space=12)
para('Personal software projects', 'title', 2)
para('Ongoing practical work with automation tools, connected applications and engineering visualization.')

assert y > 54, f'Profile content is too long: {y}'
c.setStrokeColor(light)
c.line(margin, 42, w - margin, 42)
c.setFont('Helvetica', 8)
c.setFillColor(grey)
c.drawString(margin, 28, 'MYKOLA LUKYNIUK / PORTFOLIO PROFILE')
c.drawRightString(w - margin, 28, '01')
c.showPage()
c.save()
reader = PdfReader(target)
assert len(reader.pages) == 1
assert 'STEELON' in reader.pages[0].extract_text()
print(f'Created one-page profile. Bottom content position: {y:.1f} pt.')
