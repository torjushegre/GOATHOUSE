export interface Player {
  id: string;
  name: string;
  is_bingo_participant: boolean;
  created_at: string;
}

export interface IceEvent {
  id: string;
  placer_id: string;
  victim_id: string;
  comment: string | null;
  created_at: string;
}

export interface BingoBoard {
  id: string;
  player_id: string;
  created_at: string;
}

export interface BingoCell {
  id: string;
  board_id: string;
  row: number;
  col: number;
  challenge_text: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface ShoppingItem {
  id: string;
  text: string;
  checked: boolean;
  created_at: string;
}

export interface WashWeek {
  id: string;
  week_number: number;
  year: number;
  player_id: string | null;
  created_at: string;
}

export interface WashTask {
  id: string;
  wash_week_id: string;
  task_index: number;
  completed: boolean;
  created_at: string;
}
