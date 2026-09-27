# Видеоролик с озвучкой: только по запросу

Шаблон `narrated` и инструменты `tools/` превращают урок в фильм с диктором: главы, сцены с постоянными актёрами, эпизоды с текстом диктора и интонацией, затем MP4 с озвучкой, субтитрами и главами. Это **дополнительный выпуск, а не стандартный шаг**: обычный урок остаётся презентацией, и видео делают, только когда пользователь его попросил.

Пример: `python3 create.py ../my-film --template narrated --palette ocean` — короткий фильм «Тест Уилкоксона — игра в пары» (2 главы, 5 эпизодов, числа придуманы). Он показывает все детали: карточки-счётчики, которые сортируются сами, тон эпизода и разметку в тексте диктора, вопросы.

## Когда предлагать

1. Сначала закончите и сдайте основной урок (презентацию) как обычно.
2. После сдачи **один раз** спросите: «Сделать ещё видеоролик с озвучкой?» Не предлагайте повторно, если пользователь отказался или промолчал, и не начинайте видео без ответа.
3. Если да — спросите про голос:
   - **Ключ Google AI Studio (Gemini API)**: лучшая модель `gemini-3.8-flash-tts`, интонации и теги. Ключ пользователь даёт сам; используйте его только в переменной окружения `GEMINI_API_KEY` в команде запуска, никогда не записывайте в файлы, логи и коммиты; после работы предложите перевыпустить ключ, если он оказался в тексте чата.
   - **Google Cloud через вход gcloud** (без ключа): `gemini-3.1-flash-tts-preview` в Cloud Text-to-Speech, оплата по обычному биллингу GCP-проекта. Пользователь сам выполняет `gcloud auth login`; включение API или создание ключей в его проекте — только с явного разрешения.
   - **Ключ группы от преподавателя (Vertex AI)**: временный ключ, привязанный к сервисному аккаунту, только для TTS-моделей (`--engine vertex`, `VERTEX_API_KEY`, `--project` проекта ключа); как его сделать — раздел «Временный ключ для группы».
   - **Без ключа, офлайн**: голос macOS `say` (Milena / Samantha). Интонаций нет, зато ничего не нужно.
4. Если сервис отказал (402 — закончились предоплаченные кредиты AI Studio; 401 — Cloud TTS не принимает API-ключи; 403 — ключ ограничен другим API), скажите пользователю причину и предложите другой путь, а не обходите ограничение.

## Как устроен фильм

- `js/recipes/narrated/core.js` — реестр `NARRATED`: `V.film({id, title, chapter, source, stageNote})`, `V.chapter`, `V.shot({id, fields, build(k) → paint(v)})`, `V.cue({key, tone, motion, hold, patch, title, caption, voice})`, помощники рисования `V.kit` (текст только в объявленных рамках), `V.cards` (ряд карточек-счётчиков с анимацией «было → стало» и рамками нулей), таблица тонов `V.TONE`, `V.plain` (текст без разметки).
- `js/recipes/narrated/narrated-film.js` — композер: полные позы, маршрут глав в полосе заголовка, режим записи `?record`. При смене сцены кроссфейд занимает первые 40 % движения, а поля новой сцены двигаются после — иначе анимация проигрывается на полупрозрачной сцене. Подписи получают неразрывные пробелы перед `%` и вокруг `= ÷ × →`.
- Каждый `title`, `caption`, `voice` — пара `[ru, en]`. Текст диктора (`voice`) — это и пояснения к шагу, и субтитры, и материал для озвучки.
- Удержание кадра растягивается под длину озвучки: `tools/voice.py` пишет `voice-timing.js`, и эпизод держится `озвучка + 1,6 с − движение`.
- Придуманные числа подписывайте прямо на холсте; данные источников сохраняют ссылку (`source` эпизода или `V.film({source})`).

## Интонация

Тон эпизода: `tone: 'teach'` (имя из `V.TONE`: warm, teach, play, curious, excited, serious, careful, wrap) или собственная строка стиля по-английски. Внутри текста диктора:

- `{surprised and delighted}` — смена стиля до конца клипа (отдельный сегмент запроса);
- `[pause]`, `[long pause]`, `[chuckle]`, `[sigh]`, `[breath]` — вокальные теги;
- `*слово*` — ударение (передаётся капсом).

Пример: `'…прогноз: скорее проиграет. [pause] {surprised and delighted} И ошибся! {excited and energetic} Результат…'`. Из пояснений и субтитров разметка вычищается. Произношение латиницы для русского голоса — в `tools/pronunciation.json` (упорядоченные пары «регулярное выражение → как произнести»); `voice.py` перечисляет латинские слова, оставшиеся в русском тексте.

## Собрать и проверить видео

Нужны node с Playwright (`PLAYWRIGHT_CHANNEL=chrome` берёт установленный Chrome) и ffmpeg с libx264 (`--ffmpeg`, `$FFMPEG`, PATH или `pip install imageio-ffmpeg`).

```sh
node qa/narrated/shots.cjs --mid                                       # кадры и аудит текста до озвучки
python3 tools/video.py --engine say                                    # офлайн
GEMINI_API_KEY=… python3 tools/video.py --engine gemini --check        # ключ AI Studio
python3 tools/video.py --engine cloud --project=GCP-PROJECT --check    # вход gcloud
VERTEX_API_KEY=… python3 tools/video.py --engine vertex --project=KEY-PROJECT   # ключ группы
```

`video.py` выполняет: сборку → список эпизодов (`qa/narrated/cues.cjs`) → озвучку (`tools/voice.py`, кэш по содержимому в `media/voice/`) → проверку клипов (`tools/voice_check.py`: модель Gemini слушает каждый клип рядом с текстом) → повторную сборку → рендер (`qa/narrated/render.cjs`: каждый кадр движения снимается по часам фильма, удержание снимается один раз) → склейку (`tools/mux.py` → `media/<id>.mp4` и `.srt`). Отдельные шаги можно запускать сами по себе; `voice.py --only KEY,…` переозвучивает выбранные эпизоды.

Перед сдачей: прочитайте `media/voice/check.json`, переозвучьте найденное, посмотрите промежуточные кадры и несколько кадров готового видео и честно перечислите, что проверено.

## Временный ключ для группы

Преподаватель может раздать студентам один ключ на ограниченный срок, через который можно только озвучивать. У API-ключей Google нет собственного срока действия, а Cloud Text-to-Speech ключи не принимает, поэтому ключ делается для Vertex AI и гаснет через права сервисного аккаунта. Все шаги меняют облачный проект пользователя — выполняйте их только с его явного согласия.

```sh
P=class-tts-2026            # отдельный проект: ключ не видит остальные ресурсы
gcloud projects create $P --organization=ORG_ID
gcloud billing projects link $P --billing-account=BILLING_ACCOUNT
gcloud services enable aiplatform.googleapis.com apikeys.googleapis.com iam.googleapis.com --project=$P
gcloud iam service-accounts create class-tts --project=$P
gcloud iam roles create ttsPredictOnly --project=$P --title="TTS predict only" \
  --permissions=aiplatform.endpoints.predict --stage=GA      # запускать модели, ничего не создавать и не удалять
gcloud projects add-iam-policy-binding $P --role=projects/$P/roles/ttsPredictOnly \
  --member=serviceAccount:class-tts@$P.iam.gserviceaccount.com \
  --condition='expression=request.time < timestamp("2026-10-11T20:00:00Z"),title=until-2026-10-11'
gcloud services api-keys create --project=$P --display-name="class TTS" \
  --service-account=class-tts@$P.iam.gserviceaccount.com --api-target=service=aiplatform.googleapis.com
gcloud billing budgets create --billing-account=BILLING_ACCOUNT --display-name="class TTS" \
  --budget-amount=100USD --filter-projects=projects/$P --threshold-rule=percent=0.5 --threshold-rule=percent=1.0
```

- В организации ключи с привязкой к сервисному аккаунту по умолчанию запрещены (`iam.managed.disableServiceAccountApiKeyCreation`). Узкое исключение на уровне проекта: `enforce: true` с параметром `allowedServices: [aiplatform.googleapis.com]`; применяется примерно за минуту.
- Белый список моделей — политика `vertexai.allowedModels` на проекте со значениями `publishers/google/models/gemini-3.1-flash-tts-preview:predict` и `…/gemini-2.5-pro-tts:predict`. Замечено: в точке `global` политика не остановила `gemini-2.5-flash` (в `us-central1` остановила), поэтому дешёвая текстовая модель остаётся доступной. Бюджет-оповещение обязательно; оно пишет письма, но не останавливает траты.
- Условие IAM по имени модели (`resource.name.endsWith("-tts")`) для Vertex не работает — роль тогда не действует совсем. Используйте только условие по времени; права расходятся за 1–2 минуты.
- Ключ не даёт управлять ресурсами: API ограничен Vertex AI, а роль содержит одно право на запуск моделей. После срока ключ бесполезен; сам ключ и проект стоит удалить.
- Проверка клипов (`voice_check.py`) с таким ключом не работает: ей нужна текстовая модель. Студентам хватит просмотра кадров и прослушивания.

## Подводные камни, найденные на практике

- **Нейросетевой голос ошибается в словах.** Например, склеивает «ген. А яркость» в «генерал» или заменяет «учитель» на «U-тест». Проверка клипов находит такие места; лечится переформулировкой фразы и `--only`.
- **Слова темпа модель выполняет слишком буквально.** Стили со «slower», «measured pace» и частые `[pause]` дали 8–9 символов в секунду и до 38 % тишины. Задавайте характер, а не скорость. Cloud-запрос уже просит «lively, natural pace; keep pauses short».
- **Cloud TTS принимает один стиль на запрос**, поэтому `{стиль}`-сегменты синтезируются отдельно и склеиваются с паузой 80 мс. Вокальные теги переводятся в разметку Cloud (`[short pause]`, `[laughing]`, `[sigh]`).
- **Заглавные буквы в русском тексте** иногда читаются как аббревиатура — ставьте ударение на одно-два слова в клипе, не больше.
- Модель `gemini-3.8-flash-tts` доступна только через Gemini API (AI Studio); в Cloud TTS и Vertex её может не быть. Предоплаченные кредиты AI Studio общие для проектов одного счёта.
