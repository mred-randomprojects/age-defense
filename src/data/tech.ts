import { TechUpgrade } from '../types/game';

export const INITIAL_TECHS: TechUpgrade[] = [
  {
    id: 'tech_damage',
    name: 'Kinetic & Energy Caliber',
    description: '+12% damage dealt by all defensive towers.',
    currentRank: 0,
    maxRank: 5,
    costScience: 75,
    statMultiplier: 0.12,
  },
  {
    id: 'tech_range',
    name: 'Advanced Optics & Targeting',
    description: '+10% targeting range for all towers.',
    currentRank: 0,
    maxRank: 5,
    costScience: 60,
    statMultiplier: 0.10,
  },
  {
    id: 'tech_speed',
    name: 'Rapid Cycle Mechanisms',
    description: '+10% attack speed across all turrets.',
    currentRank: 0,
    maxRank: 5,
    costScience: 80,
    statMultiplier: 0.10,
  },
  {
    id: 'tech_bounty',
    name: 'Scavenger Protocols',
    description: '+15% bonus gold collected from eliminated hostiles.',
    currentRank: 0,
    maxRank: 5,
    costScience: 50,
    statMultiplier: 0.15,
  },
  {
    id: 'tech_interest',
    name: 'Treasury Compound Yield',
    description: '+3% gold earned on treasury reserves at the end of each wave.',
    currentRank: 0,
    maxRank: 5,
    costScience: 90,
    statMultiplier: 0.03,
  },
];
