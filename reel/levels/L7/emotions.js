// L7/emotions.js — from the clipforge chibi_paper kit (own code, MIT with this repo). Only import paths changed.
// emotions.js: whole-body emotion presets for the chibi_paper rig — face (eyes/brows/mouth/fx) AND body (head tilt, shrug,
// bend, arms with elbows, knees, squash & stretch).  Use: drawChibi(c, spec, { ...EMOTIONS.pride, yaw: .2 }).
// POSES: the sit/kneel/jump set the ref g3 needs (crowd sits and kneels, the jumper squats, flies, lands).
export const EMOTIONS = {
  delight:  { ru: 'восторг',       eyes: 'happy',  brows: 'up',    mouth: 'big',   armL: 2.8, armR: 2.8, elbowL: -.1, elbowR: -.1, sy: 1.12, sx: .93, legL: .22, legR: -.22, head: -.1 },
  laugh:    { ru: 'смех',          eyes: 'closed', brows: 'up',    mouth: 'big',   armL: .55, armR: .55, elbowL: 1.8, elbowR: 1.8, head: -.3, bend: -.16, sx: 1.07, sy: .92, legL: .12, legR: -.12, fx: 'tear' },
  fright:   { ru: 'испуг',         eyes: 'wide',   brows: 'sad',   mouth: 'wavy',  armL: 1.95, armR: 1.95, elbowL: 1.3, elbowR: 1.3, shrug: 18, bend: -.14, sx: 1.06, sy: .9, legL: .2, legR: -.2, kneeL: -.3, kneeR: .3, fx: 'sweat' },
  surprise: { ru: 'удивление',     eyes: 'wide',   brows: 'up',    mouth: 'o',     armL: 1.45, armR: 1.45, elbowL: -.5, elbowR: -.5, sy: 1.1, sx: .95, head: -.12, legL: .12, legR: -.12 },
  hurt:     { ru: 'обида',         eyes: 'half',   brows: 'sad',   mouth: 'pout',  armL: .3, armR: .3, elbowL: 1.5, elbowR: 1.5, head: .24, yaw: -.45, look: -1, bend: .1, shrug: 6, fx: 'tear' },
  anger:    { ru: 'злость',        eyes: 'half',   brows: 'angry', mouth: 'grit',  armL: .55, armR: .55, elbowL: -.7, elbowR: -.7, shrug: 12, bend: .16, head: .1, legL: .25, legR: -.25, kneeR: .35, sx: 1.07, sy: .94, fx: 'blush' },
  pride:    { ru: 'гордость',      eyes: 'closed', brows: 'up',    mouth: 'smirk', armL: .8, armR: .8, elbowL: -2.3, elbowR: -2.3, head: -.24, bend: -.12, sy: 1.06, legL: .16, legR: -.16 },
  shame:    { ru: 'стыд',          eyes: 'closed', brows: 'sad',   mouth: 'wavy',  armL: .15, armR: .15, elbowL: 1.0, elbowR: 1.0, head: .36, bend: .12, shrug: 16, legL: -.08, legR: .14, kneeR: .22, look: 1, sy: .95, fx: 'blush' },
  sly:      { ru: 'хитрость',      eyes: 'half',   brows: 'sly',   mouth: 'smirk', yaw: .55, armR: 1.4, elbowR: 1.7, armL: .8, elbowL: -2.3, head: .14, look: 1, bend: .12 },
  nervous:  { ru: 'волнение',      eyes: 'open',   brows: 'sad',   mouth: 'wavy',  armL: .35, armR: .35, elbowL: 2.1, elbowR: 2.1, shrug: 12, kneeL: .32, kneeR: -.32, legL: -.1, legR: .1, sy: .94, look: -1, head: .08, fx: 'sweat' },
  letdown:  { ru: 'разочарование', eyes: 'half',   brows: 'sad',   mouth: 'frown', armL: -.2, armR: -.2, head: .4, bend: .1, drop: 6, sy: .88, sx: 1.05, shrug: -4 },
  relief:   { ru: 'облегчение',    eyes: 'closed', brows: 'sad',   mouth: 'smile', armR: .4, elbowR: 2.1, armL: .15, elbowL: .2, head: -.22, bend: -.08, sy: .96, legL: .1, legR: -.1, fx: 'sweat' },
};
export const POSES = {
  sit:     { ru: 'сидит',           drop: 40, legL: 1.35, legR: -1.35, kneeL: -2.05, kneeR: 2.05, armL: .15, armR: .15, elbowL: .9, elbowR: .9 },
  sitClap: { ru: 'сидит, ликует',  drop: 40, legL: 1.35, legR: -1.35, kneeL: -2.05, kneeR: 2.05, armL: .7, armR: .7, elbowL: 1.5, elbowR: 1.5, eyes: 'happy', mouth: 'big' },
  kneel:   { ru: 'на коленях',      drop: 24, fore: .7, shin: 0, legL: .08, legR: -.08, armL: .2, armR: .2, elbowL: 1.1, elbowR: 1.1 },
  squat:   { ru: 'присед',          drop: 12, legL: .35, kneeL: -.7, legR: -.35, kneeR: .7, bend: .12, armL: -.55, armR: -.55, sy: .9, sx: 1.06, eyes: 'open', brows: 'angry', mouth: 'flat' },
  fly:     { ru: 'полёт',           yaw: Math.PI / 2, legL: -.9, kneeL: 1.5, legR: .5, kneeR: .9, armL: 2.4, armR: 1.8, elbowL: -.4, bend: .15, sy: 1.06, eyes: 'happy', mouth: 'big' },
  land:    { ru: 'приземление',     drop: 14, legL: .4, kneeL: -.8, legR: -.4, kneeR: .8, armL: 1.45, armR: 1.45, elbowL: -.3, elbowR: -.3, sy: .9, sx: 1.07, eyes: 'happy', mouth: 'open' },
};
