// The 14 official label ids from the task. Order matches CLASSES in solution.py.
export const CLASSES = [
  { id: "accident", name: "Collision", color: "#cf6b6b" },
  { id: "near_miss", name: "Near miss", color: "#d9925a" },
  { id: "red_light", name: "Red-light running", color: "#c96f8f" },
  { id: "wrong_way", name: "Wrong-way driving", color: "#9a7cc4" },
  { id: "illegal_u_turn", name: "Illegal U-turn", color: "#7f7fc9" },
  { id: "stopped_vehicle", name: "Stopped vehicle", color: "#8a9bab" },
  { id: "jaywalking", name: "Pedestrian on roadway", color: "#4fa3a5" },
  { id: "failure_to_yield", name: "Not yielding to a pedestrian", color: "#5fa78a" },
  { id: "illegal_turn", name: "Illegal turn", color: "#6f8fd6" },
  { id: "solid_line_crossing", name: "Solid line crossing", color: "#5c9ed1" },
  { id: "stop_line", name: "Stop-line violation", color: "#b3a857" },
  { id: "congestion", name: "Congestion", color: "#c19a72" },
  { id: "road_obstacle", name: "Obstacle on road", color: "#86a863" },
  { id: "fire_smoke", name: "Fire or smoke", color: "#d07c5a" },
] as const;

export type ClassId = (typeof CLASSES)[number]["id"];

const byId = new Map<string, { id: string; name: string; color: string }>(CLASSES.map((c) => [c.id, c]));

export function classInfo(id: string) {
  return byId.get(id) ?? { id, name: id, color: "#9e9e9e" };
}

/** Order label ids the way CLASSES lists them. */
export function sortByClassOrder(ids: string[]): string[] {
  const order = new Map<string, number>(CLASSES.map((c, i) => [c.id, i]));
  return [...ids].sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99));
}
