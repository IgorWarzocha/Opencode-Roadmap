import type { Roadmap, RoadmapStorage, ValidationError } from "./types";
export declare class FileStorage implements RoadmapStorage {
    private directory;
    constructor(directory: string);
    exists(): Promise<boolean>;
    read(): Promise<Roadmap | null>;
    write(roadmap: Roadmap): Promise<void>;
    archive(): Promise<string>;
}
export declare class RoadmapValidator {
    static validateFeatureNumber(number: string): Promise<ValidationError | null>;
    static validateActionNumber(number: string): Promise<ValidationError | null>;
    static validateActionSequence(actions: Array<{
        number: string;
    }>, globalSeenNumbers?: Set<string>, featureNumber?: string): Promise<ValidationError[]>;
    static validateFeatureSequence(features: Array<{
        number: string;
        actions: Array<{
            number: string;
        }>;
    }>): Promise<ValidationError[]>;
    static validateTitle(title: string, fieldType: "feature" | "action"): Promise<ValidationError | null>;
    static validateDescription(description: string, fieldType: "feature" | "action"): Promise<ValidationError | null>;
    static validateStatusProgression(currentStatus: string, newStatus: string): Promise<ValidationError | null>;
}
