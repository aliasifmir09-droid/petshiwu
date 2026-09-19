import { NEXT_DAY_ZIPS, type MetroState, type NextDayZone } from './nextDayMetroZips';

export const STATE_LABELS: Record<MetroState, string> = {
  NY: 'New York',
  NJ: 'New Jersey',
  CT: 'Connecticut',
};

export type NextDayZipRow = { zip: string; area: string; state: MetroState };

export type NextDayCityGroup = {
  city: string;
  zips: string[];
};

export type NextDayStateGroup = {
  state: MetroState;
  label: string;
  cities: NextDayCityGroup[];
  zipCount: number;
};

export function listNextDayZips(): NextDayZipRow[] {
  return Object.entries(NEXT_DAY_ZIPS)
    .map(([zip, zone]: [string, NextDayZone]) => ({ zip, area: zone.area, state: zone.state }))
    .sort((a, b) => a.zip.localeCompare(b.zip));
}

export function groupNextDayZipsByState(): NextDayStateGroup[] {
  const byState = new Map<MetroState, Map<string, string[]>>();
  for (const row of listNextDayZips()) {
    if (!byState.has(row.state)) byState.set(row.state, new Map());
    const cities = byState.get(row.state)!;
    const current = cities.get(row.area) ?? [];
    current.push(row.zip);
    cities.set(row.area, current);
  }

  const order: MetroState[] = ['NY', 'NJ', 'CT'];
  return order
    .filter((state) => byState.has(state))
    .map((state) => {
      const cities = [...byState.get(state)!.entries()]
        .map(([city, zips]) => ({ city, zips: zips.sort() }))
        .sort((a, b) => a.city.localeCompare(b.city));
      return {
        state,
        label: STATE_LABELS[state],
        cities,
        zipCount: cities.reduce((sum, city) => sum + city.zips.length, 0),
      };
    });
}

export const NEXT_DAY_ZIP_COUNT = Object.keys(NEXT_DAY_ZIPS).length;

export function filterNextDayGroups(
  groups: NextDayStateGroup[],
  query: string
): NextDayStateGroup[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return groups;
  return groups
    .map((group) => ({
      ...group,
      cities: group.cities
        .map((city) => ({
          ...city,
          zips: city.zips.filter(
            (zip) =>
              zip.includes(needle) ||
              city.city.toLowerCase().includes(needle) ||
              group.label.toLowerCase().includes(needle)
          ),
        }))
        .filter((city) => city.zips.length > 0),
    }))
    .filter((group) => group.cities.length > 0);
}
