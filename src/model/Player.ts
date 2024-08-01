import { UUID } from "crypto";

export interface Player {
    id: UUID
    score: number;
    username: string;
    zeroCount: number;
    scoreHistory: number[]
}