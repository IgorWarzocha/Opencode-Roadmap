import type { Roadmap, RoadmapStorage, ValidationError } from "./types";
export declare class FileStorage implements RoadmapStorage {
    private directory;
    constructor(directory: string);
    exists(): Promise<boolean>;
    read(): Promise<Roadmap | null>;
    write(roadmap: Roadmap): Promise<void>;
}
export declare class RoadmapValidator {
    static validateFeatureNumber(number: string): ValidationError | null;
    static validateActionNumber(number: string): ValidationError | null;
    static validateActionSequence(actions: Array<{
        number: string;
    }>): ValidationError[];
    static validateFeatureSequence(features: Array<{
        number: string;
        actions: Array<{
            number: string;
        }>;
    }>): ValidationError[];
    static validateStatusProgression(currentStatus: string, newStatus: string): ValidationError | null;
}
