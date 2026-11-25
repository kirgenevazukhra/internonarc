# Сайты-приглашения

Тестовая сборка по промпту `../prompts/invitation-site-prompt.md`: один движок, у каждого события свой конфиг.

- Демо-событие: `events/timur-aigerim/` (вымышленные данные, `"demo": true`, анкета не подключена).
- Видео прохода: `demo/demo-walkthrough.mp4`.
- Как сделать новое приглашение: `docs/NEW-INVITATION.md`. Публикация: `docs/DEPLOYMENT.md`.
- Анкета → Google Таблица: `backend/google-apps-script/`.

```bash
node scripts/build.mjs && cd dist && python3 -m http.server 8000
# http://localhost:8000/timur-aigerim/        ?lang=ru  ?to=Айгерим  ?open=1 (сразу открыть, без звука — для проверок)
```

Музыка в демо — синтезированная заглушка. Шрифты: Cormorant Garamond, Montserrat, Bad Script (SIL Open Font License).
