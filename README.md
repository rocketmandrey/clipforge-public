# clipforge — public

Шоукейс харнесса **clipforge** и открытая механика его шоурила. Каждый кадр **нарисован кодом**. Внутри нет ни одной сгенерированной картинки и ни одной видеомодели. Музыка и звуки синтезированы, голос — ElevenLabs v4 с эмоциями. Это кусок харнесса **clipforge** для Claude Code, который делает музыкальные клипы из трека. Им же снят шоурил самого clipforge: 9 этапов воронки в 9 стилях.

🎬 Ролик — в [Releases](../../releases). Как его делали — в [SHOWREEL.md](SHOWREEL.md). В репо весь код ролика: механика, 9 уровней в 9 стилях и шаблон для своего уровня. `npm run demo` собирает этот же шоурил у вас.

## За 5 минут
```sh
git clone https://github.com/rocketmandrey/clipforge-public && cd clipforge-public
npm i && pip install -r requirements.txt
npm run doctor          # проверит node, ffmpeg, numpy, Chrome и скажет, что доставить
npm run demo            # → out/showreel.mp4 + out/sheet.png   (npm run demo:wide → 16:9)
```
Нужны Node 18+, Python 3, ffmpeg и Chrome (Chromium или Edge тоже подойдут, путь можно задать в `CHROME=`). Голос: `ELEVENLABS_API_KEY=... npm run demo`. Готовые mp3 реплик можно положить в `out/vo/`, тогда ключ не нужен (`ELEVENLABS_API_KEY=cached`). Без голоса ролик соберётся с музыкой и звуками.

## Свой ролик: промпт для Claude Code
Откройте папку кита в Claude Code и вставьте:
```
Сделай шоурил про мой проект https://github.com/<you>/<repo> по скиллу showreel.
Разбей суть проекта на 4–6 этапов, на каждый этап — уровень в своём стиле (придумай свои техники или возьми идеи из STYLES.md),
герой один на всех. По агенту на уровень, старт — копия L0_template.js.
Реплики с эмоциями в reel/lines.json. Собери npm run demo, посмотри out/sheet.png и крупные кадры на kill
и в проходах сам, потом покажи мне.
```

## Что внутри
| | |
|---|---|
| `reel/levels/L0_template.js` | **начните отсюда:** уровень-шаблон на 80 строк, меняете `BASE` и получаете свой этап |
| `reel/levels/L1…L9` | 9 уровней шоурила, каждый в своём стиле: NES-пиксель, ризограф, карандаш, тушь-орнамент, мелки, кляксы Роршаха, чиби, конфетный поп. Рядом в `L2…L9/` — куски китов стилей |
| `reel/index.html` | компоновщик: таймлайн уровней, камера влетает в проход, в проёме уже живёт следующий уровень |
| `reel/timeline.js` | общие часы: 144 BPM, доля = 10 кадров, бит-план каждого уровня (бой → kill → лут → проход) |
| `reel/hero.js` | один герой-скелет на все стили: полигоны с ролями, каждая техника рисует их по-своему, поэтому персонаж не плывёт |
| `tools/render.mjs` | headless Chrome → ffmpeg; `--sheet` (контакт-лист), `--events` (события для звука), `--query=only=N` (один уровень) |
| `tools/audio.py` | синтез музыки (тембр под стиль уровня), SFX по событиям уровней, приглушение музыки под голос, −14 LUFS, проверка синхронизации бочек. Только numpy |
| `tools/vo.py` | озвучка eleven_v4: теги эмоций, `previous_text`, укладка реплик в тайминг |
| `tools/suno.py` | **ваш** трек Suno по ссылке: аудио без перекодирования, текст, очищенный под субтитры, обложка, метаданные |
| `tools/beats.py` | удары **вашего** трека: стем барабанов (demucs), бочка и снейр отдельно, сильные удары, дропы, стопы |
| `.claude/skills/showreel/` | скилл: «сделай шоурил про мой проект» |
| `SHOWREEL.md` | как сделан шоурил: сценарий v1→v3, что сказали две модели-критика, что показывает каждый уровень, цифры |
| `STAGES.md` | подсказки по 9 этапам «трек → клип»: что делать и где грабли |
| `REPOS.md` | каталог открытых моушн-репо, которые мы разобрали: что брать, что пропустить; благодарности |
| `STYLES.md` | галерея из 6 стилей с открытыми исходниками: акварель, тушь, ручка, витражи, бумага, VHS |
| `RULES.md` | 13 правил режиссуры, выросших из жалоб зрителей |
| `VOICE.md` | шпаргалка по eleven_v4: настройки, теги, укладка, микс |
| `COLAB.md` | как рендерить тяжёлые шейдеры на Google Colab ×4.6 и не сжечь CU |
| `LEVELS.md` | интерфейс уровня и бриф для агента |

## «Жги токены»: основные части
Клип [«Жги токены»](https://www.youtube.com/watch?v=XCfsXR0rG8w) сделан тем же подходом, его репо открыт: [rocketmandrey/vibecoder-anthem](https://github.com/rocketmandrey/vibecoder-anthem). Стек: p5.js + p5.brush, синк по словам (ElevenLabs Scribe) и по сетке битов, тайм-варп.
| | |
|---|---|
| [ANIMATION_GUIDE.md](https://github.com/rocketmandrey/vibecoder-anthem/blob/main/ANIMATION_GUIDE.md), [CLAUDE.md](https://github.com/rocketmandrey/vibecoder-anthem/blob/main/CLAUDE.md) | правила анимации и инструкция агенту |
| [STORYBOARD_TOKENS*.md](https://github.com/rocketmandrey/vibecoder-anthem/blob/main/STORYBOARD_TOKENS2.md) | раскадровки трёх версий клипа |
| [SYNC_AUDIT.md](https://github.com/rocketmandrey/vibecoder-anthem/blob/main/SYNC_AUDIT.md), [scripts/](https://github.com/rocketmandrey/vibecoder-anthem/tree/main/scripts) | синк: `scribe.py` (слова), `master_grid.py` / `master_offset.py` (сетка битов и сдвиг), `sync_audit.py` (проверка) |
| [render.mjs](https://github.com/rocketmandrey/vibecoder-anthem/blob/main/render.mjs) | рендер кадр за кадром в mp4 |
| [src/core.js](https://github.com/rocketmandrey/vibecoder-anthem/blob/main/src/core.js), [timeline.js](https://github.com/rocketmandrey/vibecoder-anthem/blob/main/src/timeline.js), [vertical.js](https://github.com/rocketmandrey/vibecoder-anthem/blob/main/src/vertical.js) | движок, таймлайн глав, вертикальная версия |
| [src/clawd.js](https://github.com/rocketmandrey/vibecoder-anthem/blob/main/src/clawd.js), [cast.js](https://github.com/rocketmandrey/vibecoder-anthem/blob/main/src/cast.js), [props.js](https://github.com/rocketmandrey/vibecoder-anthem/blob/main/src/props.js), [kremlin.js](https://github.com/rocketmandrey/vibecoder-anthem/blob/main/src/kremlin.js) | персонажи и реквизит |
| [src/tokens/kit.js](https://github.com/rocketmandrey/vibecoder-anthem/blob/main/src/tokens/kit.js), [tokens2/acid.js](https://github.com/rocketmandrey/vibecoder-anthem/blob/main/src/tokens2/acid.js) | киты стилей версий 1 и 2 |
| [src/tokens3/warp.js](https://github.com/rocketmandrey/vibecoder-anthem/blob/main/src/tokens3/warp.js), [vfocus.js](https://github.com/rocketmandrey/vibecoder-anthem/blob/main/src/tokens3/vfocus.js), [audio.js](https://github.com/rocketmandrey/vibecoder-anthem/blob/main/src/tokens3/audio.js) | тайм-варп под биты, фокус кадра, аудиоанализ в браузере |
| [src/tokens3/ch/](https://github.com/rocketmandrey/vibecoder-anthem/tree/main/src/tokens3/ch) и соседние `ch/` | главы клипа: одна глава = один файл |

## Что не входит
Это шоукейс, а не весь харнесс. Режиссёр, раскадровщик, судьи, бенч и подробные инструкции остаются в приватном clipforge. Код шоурила открыт целиком: берите уровни как пример, а стили для своего ролика стройте свои. Подсказки по этапам — в `STAGES.md`.

Код — MIT (шрифт Fredoka в `reel/levels/L8/fonts` — SIL OFL 1.1). Мимика Клоди в уровне 3 — по мотивам [JohnHeibel/ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) (MIT). Остальные благодарности — в `REPOS.md`.
