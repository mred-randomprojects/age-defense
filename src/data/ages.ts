import { AgeDefinition, AgeId } from '../types/game';

export const AGES: Record<AgeId, AgeDefinition> = {
  stone: {
    id: 'stone',
    name: 'Stone Age',
    themeColor: '#78716c', // stone-500
    accentColor: '#eab308', // amber-500
    borderColor: '#a8a29e',
    description: 'Crude tools and primal survival. Fling jagged rocks, thrust sharp flint spears, and ignite roaring bonfires.',
    eraYear: '10,000 BCE',
    costGold: 400,
    costScience: 120,
    abilityName: 'Boulder Avalanche',
    abilityDescription: 'Summons rolling prehistoric boulders crashing across the trail, dealing 200 physical damage to all enemies.',
    abilityCooldownSec: 40,
  },
  medieval: {
    id: 'medieval',
    name: 'Medieval Age',
    themeColor: '#b45309', // amber-700
    accentColor: '#38bdf8', // sky-400
    borderColor: '#f59e0b',
    description: 'Fortresses, heavy iron, and black powder. Deploy rapid repeating crossbows, siege ballistas, explosive bombards, and arcane lightning spires.',
    eraYear: '1250 CE',
    costGold: 950,
    costScience: 420,
    abilityName: 'Fire Arrow Volley',
    abilityDescription: 'Rains flaming pitch arrows across the battlefield, dealing 380 instant damage and burning targets for 5s.',
    abilityCooldownSec: 45,
  },
  modern: {
    id: 'modern',
    name: 'Modern Industrial',
    themeColor: '#0284c7', // sky-600
    accentColor: '#22c55e', // green-500
    borderColor: '#38bdf8',
    description: 'Industrialized war and mechanized armor. Deploy vulcan gatling miniguns, .50 cal anti-materiel sniper nests, rocket batteries, and high-voltage tesla grids.',
    eraYear: '1985 CE',
    costGold: 2200,
    costScience: 950,
    abilityName: 'Artillery Carpet Bomb',
    abilityDescription: 'Commands an airstrike bombardment obliterating the field with 750 explosive blast damage and stunning survivors.',
    abilityCooldownSec: 50,
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Future',
    themeColor: '#9333ea', // purple-600
    accentColor: '#06b6d4', // cyan-500
    borderColor: '#c084fc',
    description: 'Plasma acceleration and relativistic weaponry. Deploy thermal plasma beam emitters, hypersonic gauss railguns, black hole singularity mortars, and temporal stasis grids.',
    eraYear: '2180 CE',
    costGold: 0,
    costScience: 0,
    abilityName: 'Orbital Particle Cannon',
    abilityDescription: 'Channels a kinetic ion ray from orbit that disintegrates target creeps for 1600 pure damage.',
    abilityCooldownSec: 60,
  },
};

export const AGE_ORDER: AgeId[] = ['stone', 'medieval', 'modern', 'cyber'];

export function getNextAge(current: AgeId): AgeId | null {
  const idx = AGE_ORDER.indexOf(current);
  if (idx >= 0 && idx < AGE_ORDER.length - 1) {
    return AGE_ORDER[idx + 1];
  }
  return null;
}
