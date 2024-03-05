import {Kalam} from "next/font/google";
import ContentEditable, {ContentEditableEvent} from "react-contenteditable";

import {TextLayer} from "@/types/canvas";
import {cn, colorToCss} from "@/lib/utils";
import {useMutation} from "@/liveblocks.config";
import {getEmbedding} from "@/lib/openai";
import {dasIndex} from "@/lib/db/pinecone";


const font = Kalam({
    subsets: ["latin"],
    weight: ["400"],
});

const calculateFontSize = (width: number, height: number) => {
    const maxFontSize = 96;
    const scaleFactor = 0.5;
    const fontSizeBasedOnHeight = height * scaleFactor;
    const fontSizeBasedOnWidth = width * scaleFactor;

    return Math.min(
        fontSizeBasedOnHeight,
        fontSizeBasedOnWidth,
        maxFontSize
    );
}

interface TextProps {
    id: string;
    layer: TextLayer;
    onPointerDown: (e: React.PointerEvent, id: string) => void;
    selectionColor?: string;
    boardId: string;
};

export const Text = ({
                         layer,
                         onPointerDown,
                         id,
                         selectionColor,
                         boardId,
                     }: TextProps) => {
    const {x, y, width, height, fill, value} = layer;

    const updateValue = useMutation(async (
        {storage},
        newValue: string,
    ) => {
        const liveLayers = storage.get("layers");

        liveLayers.get(id)?.set("value", newValue);

        try {
            const response = await fetch('/api/text-content', {
                method: 'POST',
                body: JSON.stringify(
                    {
                        boardId: boardId,
                        id: id,
                        content: newValue
                    })
            })
            if (!response.ok) throw Error("Status code: " + response.status);

        } catch (e) {
            console.error(e)
        }

    }, []);

    const handleContentChange = (e: ContentEditableEvent) => {
        updateValue(e.target.value);
    };

    return (
        <foreignObject
            x={x}
            y={y}
            width={width}
            height={height}
            onPointerDown={(e) => onPointerDown(e, id)}
            style={{
                outline: selectionColor ? `1px solid ${selectionColor}` : "none"
            }}
        >
            <ContentEditable
                html={value || "Text"}
                onChange={handleContentChange}
                className={cn(
                    "h-full w-full flex items-center justify-center text-center drop-shadow-md outline-none",
                    font.className
                )}
                style={{
                    fontSize: calculateFontSize(width, height),
                    color: fill ? colorToCss(fill) : "#000",
                }}
            />
        </foreignObject>
    );
};
