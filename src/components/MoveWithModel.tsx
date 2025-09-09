import { Logo } from "@/components/Logo";
import { pickTextColor } from "@/lib/colors";
import { modelColor, niceModelName } from "@/lib/model-metadata";
import { Anchors, TourAnchor } from "./TourGuide";

export interface MoveWithModelProps {
    model: string;
    move: string;
}

export function MoveWithModel({ model, move }: MoveWithModelProps) {
    const niceModel = niceModelName(model);
    const bg = modelColor(model);
    const fg = pickTextColor(bg);
    return (
        <div>
            <Logo model={model} className="inline-block align-middle mr-1" size={20} />
            <span className="px-2 mr-1 items-center align-middle" style={{ color: fg, backgroundColor: bg }}>
                <span className="font-black mr-2">{niceModel ?? model}</span>
                <TourAnchor anchor={Anchors.explainerMove} className="overflow-scroll inline">{move}</TourAnchor>
            </span>
        </div>
    );
}