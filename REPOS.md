# Открытые репо для моушна кодом с AI-агентами

Каталог для тех, кто делает ролики с Claude Opus на Remotion, Canvas 2D, p5.js или three.js. Мы прочитали 22 репозитория и 2 каталога компонентов, ничего не устанавливая и не запуская: только README, код и лицензии через GitHub API. Разбор октябрь 2026, звёзды и даты на 2026-10-10.

**Вердикты:**
- **БЕРИ** — код можно подключать или копировать (с копирайтом), он сразу работает в покадровом рендере.
- **КРАДИ ИДЕИ** — переноси числа, формулы и приёмы, а код пиши сам: он на другом стеке, или лицензия не даёт его копировать.
- **ПРОПУСТИ** — всё полезное отсюда есть в других репо полнее.

Почти всё ниже — моушн для UI, лончей и типографики. Подробнее об этом в разделе [«Общие выводы»](#общие-выводы).

## Сводка

| Репо | Что это | Стек | Лицензия | Вердикт | Что взять |
|---|---|---|---|---|---|
| [cth9191/animate](https://github.com/cth9191/animate) | Скилл: видео в одном `<canvas>`, 7 стилей | Canvas 2D | MIT | **БЕРИ** | Заливка + штриховка по свету + дрожащий контур, морф форм, аналитические пружины |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | Фреймворк «HTML → детерминированный MP4» + реестр блоков | HTML/GSAP/three/WebGPU | Apache-2.0 (+MIT шейдеры) | **КРАДИ ИДЕИ** / частично БЕРИ | `hw-boil`, перо по кривизне, springEase, nudge-curve, WebGPU-фоны |
| [greensock/GSAP](https://github.com/greensock/GSAP) | Движок твинов и таймлайнов, все плагины бесплатны | JS | Standard «no charge» (не OSI) | **БЕРИ** (условно) | MorphSVG с рендером в canvas, seek-режим таймлайна |
| [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits) | 200+ компонентов, 60 шейдерных фонов | React/OGL/three | MIT + Commons Clause | **БЕРИ** (точечно) | Шейдер-фоны (Prism, Galaxy, Aurora) с подменой `uTime = frame/fps` |
| [airbnb/lottie-web](https://github.com/airbnb/lottie-web) | Проигрыватель Lottie | JS/Canvas/SVG | MIT | **КРАДИ ИДЕИ** / условно БЕРИ | `goToAndStop(frame, true)` в canvas; кривые и морфы из JSON |
| [LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill) | Принципы моушн-дизайна для агентов | текст | MIT | **КРАДИ ИДЕИ** | Лучшие числа: anticipation, follow-through, правило 1/3, фоновая жизнь |
| [whaleyxbt/claude-motion](https://github.com/whaleyxbt/claude-motion) | Тулкит: скиллы, web-симуляции `render(t)`, SFX | three.js/Remotion | MIT | **КРАДИ ИДЕИ** | Таблица изингов/пружин/стаггера, `keyed()`, boil и grain на SVG |
| [howseen-ai/claude-motion-design](https://github.com/howseen-ai/claude-motion-design) | Пайплайн `window.seek(t)` + Playwright + ffmpeg | HTML/Canvas/SVG | MIT | **КРАДИ ИДЕИ** | Субкадровый motion blur, детерминированные флаги Chromium, log-зум камеры |
| [Barty-Bart/motion-graphics](https://github.com/Barty-Bart/motion-graphics) | Скилл B-roll: одна форма морфится без склеек | HTML/JS | MIT (GitHub: NOASSERTION) | **КРАДИ ИДЕИ** | `seek(t)`, пружины в замкнутой форме, сумма пружин, motion blur 4 подкадра |
| [motiondivision/motion](https://github.com/motiondivision/motion) | Библиотека Motion (бывший Framer Motion) | JS/React | MIT | **КРАДИ ИДЕИ** | `spring.ts` со скоростью, `inertia.ts`, cubic-bezier |
| [remotion-dev/remotion](https://github.com/remotion-dev/remotion) | React-фреймворк видео | React | Remotion License (не OSI) | **КРАДИ ИДЕИ** | Алгоритмы: субкадровый blur, морф путей, параметрическое сердце |
| [t3knobox/klik-anim-skill-creation](https://github.com/t3knobox/klik-anim-skill-creation) | Скиллы «законы анимации» + камера + метод | Remotion | **нет лицензии** | **КРАДИ ИДЕИ** | Таблица длительностей, измеренные пружины, rest ratio, энергетическая дуга |
| [iart-ai/motion-design-skills](https://github.com/iart-ai/motion-design-skills) | 9 справочных скиллов | текст + сниппеты | MIT | **КРАДИ ИДЕИ** | Easing по семействам, стаггер от фокуса, петля шума по окружности |
| [nateherkai/hyperframes-student-kit](https://github.com/nateherkai/hyperframes-student-kit) | Учебный кит монтажа + 406 карточек | HyperFrames/GSAP | MIT (бренд AIS не брать) | **КРАДИ ИДЕИ** | Анти-дефолты, squash/stretch, частицы lerp + curl |
| [charlie947/motion-graphics-skills](https://github.com/charlie947/motion-graphics-skills) | 13 скиллов, 16 текстовых рецептов эффектов | HTML/CSS/SVG (спека) | MIT | **КРАДИ ИДЕИ** | «Морф, а не кроссфейд», ghost старта, частицы в форму |
| [AbubakrChan/product-launch-motion](https://github.com/AbubakrChan/product-launch-motion) | Скилл лонч-видео SaaS | HTML/GSAP | MIT (+NOTICE) | **КРАДИ ИДЕИ** | Easing по назначению, ограниченный синус-драйвер |
| [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | Официальные AI-скиллы GSAP | текст | MIT | **КРАДИ ИДЕИ** | Позиционная нотация таймлайна, секция MorphSVG |
| [haidrrrry/claude-remotion-skill](https://github.com/haidrrrry/claude-remotion-skill) | Скилл Remotion, 17 паттернов | Remotion | MIT | **ПРОПУСТИ** | Разве что soft-light грейд + grain, звук за 2–3 кадра до удара |
| [Sunwood-ai-labs/hyperframes-motion-reel-skill](https://github.com/Sunwood-ai-labs/hyperframes-motion-reel-skill) | Один SKILL.md (японский) | HyperFrames/GSAP | MIT | **ПРОПУСТИ** | Подтверждает «таймлайн + чистая `render(t)`» |
| [remotion-dev/skills](https://github.com/remotion-dev/skills) | Официальные скиллы Remotion | текст | как Remotion (файла нет) | **ПРОПУСТИ** | `Easing.spring({damping:200})`, `perceptual-scale` |
| [frankxai/awesome-motion-design-agent-skills](https://github.com/frankxai/awesome-motion-design-agent-skills) | Awesome-список + 5 скиллов | текст | CC0-1.0 | **ПРОПУСТИ** | Формат «токены движения + QA-чеклист» |
| [199-biotechnologies/motion-dev-animations-skill](https://github.com/199-biotechnologies/motion-dev-animations-skill) | Обёртка Motion.dev для React | React | MIT | **ПРОПУСТИ** | Нечего: дубль LottieFiles |
| 21st.dev ([21st-dev/magic-mcp](https://github.com/21st-dev/magic-mcp)) | Реестр UI-компонентов + видео-блоки Remotion + MCP | React/Remotion | по компоненту (часто unknown) | **ПРОПУСТИ** | Только поиск через MCP; видео — продуктовые UI-ролики |

---

## Что взять: подробно

### cth9191/animate — БЕРИ
Самый близкий к покадровому Canvas-рендеру. `renderFrame(t, canvas)`, `B = floor(F/2)` (boil на двойках), весь рандом через `RNG(...ключи)` (mulberry32 + hash), каждый кадр с чистого листа. Пути внутри `plugins/animate/skills/animate/`:
- `kit/core.js`: `wobble()` даёт живую линию: ресэмпл 7 px, сдвиг по нормали `0.75·sin(s·f1+p1) + 0.35·sin(s·f2+p2)`, пересев каждые 2 кадра. `ink({double})` добавляет второй тонкий штрих (0.4 толщины, alpha 0.55), который немного не совпадает с первым.
- `paint()`: плоская заливка, текстура в клипе по контуру и контур поверх. Текстуры `hatch` с функцией плотности `dens(x,y)` (штриховка по свету), `cross`, `pencil`, `stipple`, `grain`. Это самый дешёвый путь к «богатой» иллюстрации.
- Пружины `springEase(t,k,d)`, пресеты snappy 320/30, smooth 170/26, heavy 90/19, playful 260/14. `springTrack` меняет цель на ходу без разрыва.
- `kit/morph.js`: морф «мир → мир». Старая сцена схлопывается в окно формы, контур A переходит в B (`byAngle(P,96)`), новая раскрывается. Камера `camOf()` ставит точку мира в точку экрана, `bump()` даёт пульс по биту.
- Стили riso (3 пластины, растр под углом, overprint, мисрегистрация), cut-paper, sketchbook, pixel (Bayer 4×4), isometric. Правила в `craft.md`: что-то новое каждые 2–4 с, жизнь в держимых кадрах, морф-мост около 1.2 с, сетка восьмых (120 BPM при 24 fps = 6 кадров).

### heygen-com/hyperframes — КРАДИ ИДЕИ, частично БЕРИ
- `registry/components/hw-boil/hw-boil.html`: «кипящая» рукописная линия. Поза пересчитывается раз в 3–4 кадра от seeded-хеша. `hwWobbleEllipse`: овал из 14 точек с разбросом радиуса около 3%. `hwPenEase`: скорость пера `~1/(1+k·кривизна)`, но не ниже 0.22. В Canvas 2D переносится целиком.
- `skills/hyperframes-animation/adapters/gsap-easing-and-stagger.md`: springEase в замкнутой форме. Damping 1.0 даёт ход без перелёта, 0.8–0.85 — «как в iOS», 0.6–0.7 — игриво (перелёт 5–10%). Там же объяснено, почему интегрируемые пружины нельзя seek'ать.
- `rules/nudge-curve.md`: slow-fast-slow. Разгон power3.in (10% пути за 20% времени), линейный рывок (65% пути за 18%), хвост power4.out (25% пути за 62%).
- `references/motion-blur.md`: блюр только на резких движениях, 1–3 раза за ролик и не на тексте.
- WebGPU-блоки `prism`, `spiral`, `water`, `thin-film`, `goo`, `blob` годятся как подложка. Сначала проверьте WebGPU в headless (`--enable-unsafe-webgpu`), это не гарантировано. Ещё один образец time-only частиц — `spiral-galaxy`.

### greensock/GSAP — БЕРИ (условно)
- Детерминированный режим: `paused:true`, `gsap.ticker.lagSmoothing(0)`, на каждый кадр `tl.time(frame/fps)`. Твинить можно обычные JS-объекты и рисовать их в canvas.
- `src/MorphSVGPlugin.js` морфит пути с разным числом точек, `shapeIndex` не даёт форме вывернуться, а через `render(rawPath)` морф рисуется прямо в canvas.
- Ещё полезны DrawSVG (сегмент `"20% 80%"`), CustomWiggle и CustomBounce (со squash), MotionPath с autoRotate и Physics2D. Stagger умеет `from: "center" | "edges"`, `grid`, `amount`.
- Лицензия бесплатна и для коммерции, но она не OSI и отзываемая. Ставьте GSAP зависимостью и не копируйте его код в свой open-source.

### DavidHDev/react-bits — БЕРИ (точечно)
- Шейдерные OGL-фоны Prism, Galaxy, Aurora, LiquidChrome и другие зависят только от `uTime`. Замените `requestAnimationFrame` на ручной `renderer.render` с `uTime = frame/fps`, это правка в 3–5 строк. Mouse-uniforms обнулите, включите `preserveDrawingBuffer`.
- Silk, Threads и Ballpit накапливают состояние (физика, `+= delta`), им нужна правка серьёзнее.
- Код можно читать прямо в `src/content/<Категория>/<Имя>/<Имя>.jsx`. Commons Clause разрешает рендерить им свои ролики, но не перераспространять компоненты.

### airbnb/lottie-web — КРАДИ ИДЕИ, условно БЕРИ
- Готовое профессиональное движение: `renderer: 'canvas'` + `goToAndStop(frame, true)`. Время подаёте вы, rAF не участвует.
- Можно вообще не проигрывать, а читать JSON: в нём bezier-ручки easing `i`/`o`, тайминги ключей и `shapeKeyframed`, то есть морфы с уже согласованной топологией.
- Визуал плоский векторный. Рукотворную текстуру придётся накладывать поверх. Лицензию каждого ролика из каталогов проверяйте отдельно. Сам проект в режиме поддержки: последний коммит 2024-11.

### LottieFiles/motion-design-skill — КРАДИ ИДЕИ
Лучшие числа о том, «как должно двигаться». В клипе UI-длительности умножайте на 2–4.
- `director/disney-principles.md`: anticipation 10–20% хода за 100–200 мс; squash [1.2, 0.8], stretch [0.85, 1.15], удар 2–4 кадра; follow-through 50–150 мс; дуга 10–20 px поперёк пути; secondary action — 30–50% амплитуды основного движения.
- `director/choreography.md`: правило 1/3 (движение не проходит больше трети кадра без смены ключа, а из 3+ элементов одновременно движется не больше трети); фон движется против героя со скоростью 20–30% от его; параллакс 1.0 / 0.5 / 0.2.
- `reference/timing-easing-tables.md`: вход на 30–50% длиннее выхода; длительность растёт с расстоянием (100 px — 1.0×, 400 px — 1.6×); материалы: резина 0.8× с перелётом 15–25%, жидкость 1.5×, дым 2×.
- `patterns/ambient-continuous.md`: дыхание 0.98–1.02 за 2–4 с; периоды 4000/5500/3500 мс, чтобы слои не синхронизировались; фон забирает не больше 20% энергии.

### whaleyxbt/claude-motion — КРАДИ ИДЕИ
- `.claude/skills/motion-design/SKILL.md`: easeOut `(0.16,1,0.3,1)`, easeIn `(0.6,0,0.9,0.35)`, easeInOut для морфов `(0.65,0,0.35,1)`. Пружины 14/140/0.8, pop 9–11/200–230/0.7, elastic 8/200 (один раз за видео). Стаггер: слова 0.09 с, пункты 0.2–0.25 с. Выход — половина входа. Чтение: hold ≥ 1 с + 0.25 с на слово.
- `sims/kit/util.js` (2.7 КБ): `keyed(keys,t,ease)`, mulberry32 `rng(seed)`, `hash`. Копируется как есть.
- `src/components/primitives.tsx`: `Grain` (feTurbulence 0.85, seed = frame/2) и `WobbleFilter` (line boil, seed = frame/5).

### howseen-ai/claude-motion-design — КРАДИ ИДЕИ
- Motion blur субкадрами: shutter 0.5. Число субкадров зависит от скорости: стоит — 1, до 20 px/кадр — 4, иначе ceil(px/5), но не больше 64. Через жёсткий cut не блюрить.
- Флаги Chromium для идентичных перезапусков: `--deterministic-mode --run-all-compositor-stages-before-draw --disable-threaded-animation --disable-checker-imaging --font-render-hinting=none --force-color-profile=srgb`. После seek ждать 2 rAF.
- Камера — один transform с ключами `[t,zoom,x,y]`, зум интерполируется в log-пространстве. Beat punch: +0.012 на долю, +0.03 на такт после дропа.
- Easing, решённый бисекцией, даёт около 1e-9 на x=0, поэтому концы задавайте явно: 0 и 1. Seek-обёртки для GSAP/WAAPI/Lottie лежат в §9b.

### Barty-Bart/motion-graphics — КРАДИ ИДЕИ
- `skills/motion-broll/engine/motion.js`: `M.S(tau,w,z)` — отклик пружины в замкнутой форме. `M.track` суммирует пружины, по одной на каждую смену цели. Любой кадр рендерится независимо, пружины можно прерывать, а петля замыкается сама.
- Жидкий индикатор: передний край на быстрой пружине, задний на медленной, и squash/stretch получается без ключей.
- `engine/render.js`: 4 подкадра на 180° шаттера, `tmix=frames=4`. Курсор идёт по дуге `sin(π·u)·0.06`.

### motiondivision/motion — КРАДИ ИДЕИ
- `packages/motion-dom/src/animation/generators/spring.ts`: пружина как функция времени, с начальной скоростью, считает и недо-, и передемпфированный случай. `inertia.ts` даёт затухание после броска.
- Ещё: `waapi/easing/cubic-bezier.ts` и `calc-child-stagger.ts`. Пакет целиком не нужен.

### remotion-dev/remotion — КРАДИ ИДЕИ
- `packages/motion-blur`: accumulation, кадр рендерится N раз на `t + k/N·shutter/360·dt`, затем усредняется.
- `packages/shapes/src/utils/make-heart.ts`: сердце из 4 кубических безье. Пара таких путей и двойной пульс через easing дают бьющееся сердце.
- Морф путей: оба пути приводятся к одному набору команд, затем точки попарно интерполируются через lerp. Алгоритм лучше брать из d3-interpolate-path (BSD-3), а не из Remotion: у Remotion своя лицензия (бесплатно для частных лиц и компаний до 3 человек).
- Для анимации масштаба есть `interpolate` с `output: 'perceptual-scale'`.

### t3knobox/klik-anim-skill-creation — КРАДИ ИДЕИ (лицензии нет, текст и код не копировать)
- Кривые: thin-peak `(0.83,0,0.17,1)`, EASE_IN `(0.70,0,0.84,0)` (только для антиципации и выходов), WHIP `(0.90,0,0.10,1)`, GLIDE `(0.40,0,0.20,1)`.
- Длительности при 24 fps: микро 3–6 кадров, мелкий элемент 8–12, панель 14–22, сцена 20–29, камера 40–86.
- Измеренные пружины: bounce d9 k150 m0.8 — перелёт 23.8%, 833 мс; heavy d16 k80 m1.6 — 4.3%, 933 мс.
- Rest ratio: 40–60% ролика — холды с idle-жизнью. Не стартовать с scale(0), начинать с 0.90–0.97. Boil, grain и текстуры переключаются по одним часам.

### iart-ai/motion-design-skills — КРАДИ ИДЕИ
- `skills/animation-principles/references/easing-curves.md`: длительность `~ base·√(distance/base_distance)`; общий стаггер `(n-1)·offset + dur` < 800 мс; задержка растёт с расстоянием от фокуса.
- `background-recipes.md`: бесшовная петля шума — движение по окружности в пространстве шума `(cos φ, sin φ)·r`.
- `direction-playbook.md`: бриф из ровно трёх прилагательных и 4 «языка движения» (Calm/Kinetic × Soft/Sharp).

### nateherkai/hyperframes-student-kit — КРАДИ ИДЕИ
- `motion-principles.md`: не больше 2 одинаковых ease на сцену; самая медленная сцена в 3 раза медленнее самой быстрой; сцена — build/breathe/resolve 30/40/30%; минимум 3 слоя.
- `chapter-library.md`: удар — scale 1.35/0.7 на 2–3 кадра. Частицы (2000–4000) летят `lerp(start,target,ease)` + curl `sin(i·1.7+t·3)·amp·(1−p)`, с `globalCompositeOperation='lighter'`.

### charlie947/motion-graphics-skills — КРАДИ ИДЕИ
- Кода нет, только рецепты в `skills/motion-effects/references/effects.md`. Морф — это та же форма или данные в новом виде: линия прорисовывается, а не появляется фейдом.
- Читать превращение помогает ghost стартового состояния. Particle logo: точки на сетке внутри формы, seeded-старт, полёт по дуге с трейлом вместо блюра.
- Проверка петли: frame 0 == последний кадр.

### AbubakrChan/product-launch-motion — КРАДИ ИДЕИ
- `references/04-motion-grammar.md` §9: ограниченный синус-драйвер `1 + 0.09·sin(p)`, фаза твинится один раз (π — пульс, 2π — settle). Значение возвращается в покой по построению, так что дыхание и пульс получаются без бесконечных циклов.
- Таблица easing по назначению. `back.out(1.4–2.4)` здесь единственный разрешённый отскок.

### greensock/gsap-skills — КРАДИ ИДЕИ
- `skills/gsap-timeline/SKILL.md`: позиционный параметр (`"<"`, `"<0.2"`, `"label+=0.3"`). Это хорошая нотация хореографии: элемент ставится относительно другого, а не в абсолютных секундах.
- `skills/gsap-plugins/SKILL.md`: MorphSVG и CustomEase из SVG-пути.

---

## Общие выводы

1. **Готовых иллюстративных эффектов нет ни в одном репо:** морфа рисованных форм, туши, штриховки, акварели, органического роста, персонажей. Всё про UI, лончи, типографику и шейдерные фоны. Ближе всех к рисованному look подошёл cth9191/animate (заливка + штриховка по плотности + дрожащий контур). Ещё есть `hw-boil` из hyperframes. Остальное приходится писать самому, например на p5.brush.
2. **Детерминизм `render(t)` все сходятся считать основой.** Кадр — чистая функция времени. Никаких `Math.random`, `Date`, CSS transitions и накопленного состояния. Рандом seeded (mulberry32 + hash). Тогда любой кадр рендерится отдельно, а перезапуски дают тот же результат.
3. **Пружины — в замкнутой форме,** и смена цели — это сумма пружин. Интегрируемые spring-библиотеки нельзя seek'ать.
4. **Motion blur — субкадрами** (4–8 на 180° шаттера, усреднение). Он стоит ×N времени рендера и нужен только на резких ходах.
5. **Числа повторяются из репо в репо:** easeOut `(0.16,1,0.3,1)` на входы, выход на 30–50% короче входа, стаггер 2–8 кадров, anticipation 10–20%, холды 40–60% с живыми мелочами, один hero-приём на пик. UI-длительности в клипе умножайте на 2–4 и привязывайте к ударам.
6. **Рисованность на двойках.** Boil, grain и текстуры пересеваются раз в 2–4 кадра от одного счётчика, и между позами boil не интерполируются.
7. **Сверяйте лицензии.** GSAP и Remotion не OSI. У React Bits Commons Clause. У klik-anim лицензии нет, а у компонентов 21st она часто unknown. Перед копированием кода в открытый репо проверяйте каждый файл.
8. **Сцены из научпопа** (филлотаксис, ДНК, Мандельброт, мурмурация) в каталогах не найдены. Как p5/canvas-скетчи их проще написать с нуля.

---

## На чём сделан этот репо / благодарности

- [p5.js](https://github.com/processing/p5.js) и [p5.brush](https://github.com/acamposuribe/p5.brush) — кисти, штрихи и заливки «от руки».
- [JohnHeibel/ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) (MIT) — мимика Клоди в шоуриле.
- [cth9191/animate](https://github.com/cth9191/animate) (MIT) — идея «замерить палитру референса и превратить её в числа стиля» и покадровый драйв страницы.
- [demucs](https://github.com/facebookresearch/demucs) — стем барабанов для детекта ударов.
- [librosa](https://github.com/librosa/librosa) — анализ аудио.
- [puppeteer](https://github.com/puppeteer/puppeteer) — покадровый захват из headless Chrome.
- [ffmpeg](https://ffmpeg.org) — сборка видео и звука.
- ElevenLabs v4 — голос с эмоциями.

Вдохновение стилями:
- **kevin_t_ngo** (X/Twitter) — JS-рисунки Claude Opus: ink_pattern, crayon-doodle, paper-pencil chibi.
- **@beamnxw** — статья «Motion Engineering with Opus 5.5».
