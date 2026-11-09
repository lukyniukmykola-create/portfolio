# Як змінювати портфоліо

## Найчастіші зміни — один файл

Відкрийте `work/portfolio-content.json`. У ньому зібрані дані, які найчастіше потрібно оновлювати:

- `hero.headline` — доступний заголовок сторінки (візуально прихований; великий акцент — `ML`);
- `hero.subheadline` — текст під заголовком;
- `hero.availability` і `hero.location` — статус та місто;
- `about.heading`, `about.headingMuted`, `about.body` — секція About;
- `contact.heading`, `contact.headingMuted`, `contact.body` — секція Contact;
- `contact.email` — email (наприклад, `name@example.com`);
- `contact.telegram` — повне посилання `https://t.me/username` або `@username`;
- `social.github`, `social.linkedin`, `social.instagram` — соціальні мережі;
- `resume.downloadName` — назва PDF під час завантаження.

Після редагування JSON зберігайте подвійні лапки й коми. Не ставте кому після останнього поля в блоці.

## Як замінити PDF Resume

Найпростіший спосіб:

1. Замініть файл `outputs/Mykola-Lukyniuk-Resume.pdf` новою версією з такою самою назвою.
2. Запустіть збірку командою нижче.

Якщо назва PDF інша, змініть `resume.file` у `work/portfolio-content.json`, а також за потреби `resume.downloadName`.

## Інші тексти й секції

- Розмітка, назви проєктів, Experience та Skills: `work/portfolio-body.html`.
- Вигляд, темна палітра й адаптивність: `work/portfolio-style.css`.
- Інтро, навігація, налаштування анімацій і 3D-об’єкт: `work/portfolio-app.js`.
- Фонові анімації: `work/portfolio-night.js`.
- Прев’ю проєктів: `work/portfolio-previews.js`.
- Інтерактивні демо: `work/portfolio-demos.js`.

## Як замінити скрін Warrio

1. Замініть `work/assets/project-warrio-showcase.png` новим PNG із такою самою назвою.
2. Запустіть `node work/assemble.cjs`.

Назва проєкту на сайті — **Warrio**. Внутрішній ключ `vario` у JavaScript залишений для сумісності й не відображається відвідувачам.

## Як зібрати сайт після змін

У папці проєкту виконайте:

```powershell
node work/assemble.cjs
```

Готовий автономний файл з’явиться тут:

`outputs/mykola-lukyniuk.html`

Він уже містить стилі, JavaScript, графіку та PDF Resume всередині одного HTML.

## Як оновити GitHub Pages

1. Перейменуйте `outputs/mykola-lukyniuk.html` на `index.html`.
2. Покладіть `index.html` у корінь репозиторію `portfolio`.
3. У GitHub відкрийте **Settings → Pages** і виберіть **Deploy from a branch → main / root**, якщо Pages ще не ввімкнено.
4. Після наступних змін повторно замініть `index.html` і зробіть commit.

## Як завантажити на FTP

1. Перейменуйте `outputs/mykola-lukyniuk.html` на `index.html`.
2. Завантажте `index.html` у кореневу папку сайту на хостингу (`public_html`, `www`, `htdocs` або папку, яку вказав хостинг).
3. Додаткові файли не потрібні, бо HTML автономний.
4. Очистьте кеш браузера або CDN після заміни файлу.

Готовий ZIP із папкою для FTP також створюється в основній папці `outputs` цього завдання.

## Важливо про Facebook

Надане Facebook-посилання повторювало адресу GitHub, тому Facebook навмисно не показаний як окремий профіль. Додайте справжню Facebook-адресу перед його публікацією.
