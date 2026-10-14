---
name: showreel
description: Make a motion-graphics showreel for a repo, skill or product, drawn by code (canvas) with synthesized music, SFX and an emotional ElevenLabs v4 voice-over. Use when asked for a promo/showreel/relay video about a project.
---

# Showreel кодом

Кит в корне репо: `reel/` (компоновщик, часы, герой, уровни), `tools/` (рендер, звук, голос, биты). Перед работой прочитай `LEVELS.md`, `RULES.md`, `VOICE.md`, `STYLES.md`.

1. **История.** Прочитай README проекта, о котором ролик. Разбей его суть на 3–9 этапов. На каждый этап — уровень: что герой принимает от прошлой сцены, смысл этапа одной картинкой, кульминация на `kill`, что уносит в проход. Предмет-эстафета между уровнями — главный приём, он делает из слайдов историю.
2. **Стиль на уровень.** Разные техники рисования на разных уровнях (пиксель, тушь, конфетный поп, ...), но один и тот же герой из `reel/hero.js`. Старт каждого уровня — копия `reel/levels/L0_template.js`.
3. **Часы.** Впиши уровни в `SEGS` в `reel/timeline.js`. Пиши уровни параллельно: по агенту на уровень, файлы эксклюзивные, бриф по шаблону `LEVELS.md`.
4. **Проверка уровня.** `node tools/render.mjs --sheet --query=only=<N> --dur=<d>`, затем посмотри png сам.
5. **Голос.** Реплики пиши в `reel/lines.json` с тегами эмоций (`VOICE.md`), смени тембр под каждый поворот внутри реплики.
6. **Сборка.** `tools/build.sh` (и `tools/build.sh wide` для 16:9). Перед тем как показывать, посмотри `out/sheet.png` и пару крупных кадров на kill и в проходах.

Если ролик про песню, а не про проект: `python3 tools/beats.py track.mp3` даст удары, и кульминации ставятся на `kick` и `slam`, а не на сетку.
