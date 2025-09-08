import { MoveWithModel } from "@/components/MoveWithModel";
import { TokenMultilineText } from "@/components/TokenMultilineText";
import { pickTextColor } from "@/lib/colors";
import { modelColor, niceModelName } from "@/lib/model-metadata";
import type { TokenScoresList } from "@/lib/types";
import { Fragment } from "react";

export type TokenSection = {
    label: string;
    tokenScoresList: TokenScoresList;
    numLines?: number;
};

export interface MoveAndTokenSectionsProps {
    model: string;
    move: string;
    sections: TokenSection[];
}

export function MoveAndTokenSections({ model, move, sections }: MoveAndTokenSectionsProps) {
    return (
        <div className="flex">
            <div className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] items-baseline gap-x-2 gap-y-2 mb-2">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 sm:text-right">Prefix:</div>
                <MoveWithModel model={model} move={move} />
                {sections.map((s, i) => (
                    <Fragment key={i}>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 sm:text-right">{s.label}</div>
                        <div data-tour={i === 0 ? "explainer-tokens" : undefined}>
                            <TokenMultilineText tokenScoresList={s.tokenScoresList} numLines={0}/>
                        </div>
                    </Fragment>
                ))}
            </div>
        </div>
    );
}