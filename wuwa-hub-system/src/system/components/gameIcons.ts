/**
 * In-game icons for the sample Jinhsi build (© Kuro Games). These are the SOURCE URLs, for credits only: the app reads
 * its local copies in public/game/<key>.webp and never hotlinks. Fetched on 2026-10-24 from encore.moe's public game-data
 * API, which serves the game's own UI textures (the Fandom wiki forbids embedding and scripted downloads). A missing file
 * falls back to our own icon in the same slot.
 */
const R = 'https://api.encore.moe/resource/Data/Game/Aki/UI/UIResources/Common'

export const GAME_ICONS = {
  weaponAgesOfHarvest: `${R}/Image/IconWeapon/T_IconWeapon21010026_UI.webp`,
  setCelestialLight: `${R}/Image/IconElementAttri/T_IconElementAttriLight.webp`,
  echoMourningAix: `${R}/Image/IconMonsterGoods/T_IconMonsterGoods_997_UI.webp`,
  echoFissionJunrock: `${R}/Image/IconMonsterGoods/T_IconMonsterGoods_021_UI.webp`,
  echoHoartoise: `${R}/Image/IconMonsterGoods/T_IconMonsterGoods_969_UI.webp`,
  echoHoochief: `${R}/Image/IconMonsterGoods/T_IconMonsterGoods_989_UI.webp`,
  skillBasic: `${R}/Atlas/SkillIcon/SkillIconNor/SP_IconNorSword.webp`,
  skillResonance: `${R}/Atlas/SkillIcon/SkillIconJinxi/SP_IconJinxiB1.webp`,
  skillForte: `${R}/Atlas/SkillIcon/SkillIconJinxi/SP_IconJinxiY.webp`,
  skillLiberation: `${R}/Atlas/SkillIcon/SkillIconJinxi/SP_IconJinxiC1.webp`,
  skillIntro: `${R}/Atlas/SkillIcon/SkillIconJinxi/SP_IconJinxiQTE.webp`,
  skillOutro: `${R}/Atlas/SkillIcon/SkillIconJinxi/SP_IconJinxiT.webp`,
  skillInherent1: `${R}/Atlas/SkillIcon/SkillIconJinxi/SP_IconJinxiD1.webp`,
  skillInherent2: `${R}/Atlas/SkillIcon/SkillIconJinxi/SP_IconJinxiD2.webp`,
  chain1: `${R}/Image/IconDevice/T_IconDevice_JinxiM1_UI.webp`,
  chain2: `${R}/Image/IconDevice/T_IconDevice_JinxiM2_UI.webp`,
  chain3: `${R}/Image/IconDevice/T_IconDevice_JinxiM3_UI.webp`,
  chain4: `${R}/Image/IconDevice/T_IconDevice_JinxiM4_UI.webp`,
  chain5: `${R}/Image/IconDevice/T_IconDevice_JinxiM5_UI.webp`,
  chain6: `${R}/Image/IconDevice/T_IconDevice_JinxiM6_UI.webp`,
} as const satisfies Record<string, string>

export type GameIconKey = keyof typeof GAME_ICONS
