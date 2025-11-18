import { z } from "zod";
export declare const ActionStatus: z.ZodEnum<["pending", "in_progress", "completed"]>;
export type ActionStatus = z.infer<typeof ActionStatus>;
export declare const Action: z.ZodObject<{
    number: z.ZodString;
    description: z.ZodString;
    status: z.ZodEnum<["pending", "in_progress", "completed"]>;
}, "strip", z.ZodTypeAny, {
    number: string;
    status: "pending" | "in_progress" | "completed";
    description: string;
}, {
    number: string;
    status: "pending" | "in_progress" | "completed";
    description: string;
}>;
export type Action = z.infer<typeof Action>;
export declare const Feature: z.ZodObject<{
    number: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    actions: z.ZodArray<z.ZodObject<{
        number: z.ZodString;
        description: z.ZodString;
        status: z.ZodEnum<["pending", "in_progress", "completed"]>;
    }, "strip", z.ZodTypeAny, {
        number: string;
        status: "pending" | "in_progress" | "completed";
        description: string;
    }, {
        number: string;
        status: "pending" | "in_progress" | "completed";
        description: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    number: string;
    description: string;
    title: string;
    actions: {
        number: string;
        status: "pending" | "in_progress" | "completed";
        description: string;
    }[];
}, {
    number: string;
    description: string;
    title: string;
    actions: {
        number: string;
        status: "pending" | "in_progress" | "completed";
        description: string;
    }[];
}>;
export type Feature = z.infer<typeof Feature>;
export declare const Roadmap: z.ZodObject<{
    features: z.ZodArray<z.ZodObject<{
        number: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        actions: z.ZodArray<z.ZodObject<{
            number: z.ZodString;
            description: z.ZodString;
            status: z.ZodEnum<["pending", "in_progress", "completed"]>;
        }, "strip", z.ZodTypeAny, {
            number: string;
            status: "pending" | "in_progress" | "completed";
            description: string;
        }, {
            number: string;
            status: "pending" | "in_progress" | "completed";
            description: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        number: string;
        description: string;
        title: string;
        actions: {
            number: string;
            status: "pending" | "in_progress" | "completed";
            description: string;
        }[];
    }, {
        number: string;
        description: string;
        title: string;
        actions: {
            number: string;
            status: "pending" | "in_progress" | "completed";
            description: string;
        }[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    features: {
        number: string;
        description: string;
        title: string;
        actions: {
            number: string;
            status: "pending" | "in_progress" | "completed";
            description: string;
        }[];
    }[];
}, {
    features: {
        number: string;
        description: string;
        title: string;
        actions: {
            number: string;
            status: "pending" | "in_progress" | "completed";
            description: string;
        }[];
    }[];
}>;
export type Roadmap = z.infer<typeof Roadmap>;
export interface RoadmapStorage {
    read(): Promise<Roadmap | null>;
    write(roadmap: Roadmap): Promise<void>;
    exists(): Promise<boolean>;
}
export interface ValidationError {
    code: string;
    message: string;
    tutorial?: string;
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
export interface CreateRoadmapInput {
    features: Array<{
        number: string;
        title: string;
        description: string;
        actions: Array<{
            number: string;
            description: string;
            status: "pending";
        }>;
    }>;
}
export interface UpdateRoadmapInput {
    actionNumber: string;
    description?: string;
    status: ActionStatus;
}
export interface ReadRoadmapInput {
    actionNumber?: string;
    featureNumber?: string;
}
