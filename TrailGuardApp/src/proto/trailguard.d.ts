import * as $protobuf from "protobufjs";
import Long = require("long");

/** Namespace trailguard. */
export namespace trailguard {

    /**
     * Properties of a NodeInfo.
     * @deprecated Use trailguard.NodeInfo.$Properties instead.
     */
    interface INodeInfo extends trailguard.NodeInfo.$Properties {
    }

    /** Represents a NodeInfo. */
    class NodeInfo {

        /**
         * Constructs a new NodeInfo.
         * @param [properties] Properties to set
         */
        constructor(properties?: trailguard.NodeInfo.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** NodeInfo nodeId. */
        nodeId: string;

        /** NodeInfo latitude. */
        latitude: number;

        /** NodeInfo longitude. */
        longitude: number;

        /** NodeInfo batteryPct. */
        batteryPct: number;

        /** NodeInfo solarMw. */
        solarMw: number;

        /** NodeInfo lastSeenUnix. */
        lastSeenUnix: number;

        /**
         * Creates a new NodeInfo instance using the specified properties.
         * @param [properties] Properties to set
         * @returns NodeInfo instance
         */
        static create(properties: trailguard.NodeInfo.$Shape): trailguard.NodeInfo & trailguard.NodeInfo.$Shape;
        static create(properties?: trailguard.NodeInfo.$Properties): trailguard.NodeInfo;

        /**
         * Encodes the specified NodeInfo message. Does not implicitly {@link trailguard.NodeInfo.verify|verify} messages.
         * @param message NodeInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: trailguard.NodeInfo.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified NodeInfo message, length delimited. Does not implicitly {@link trailguard.NodeInfo.verify|verify} messages.
         * @param message NodeInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: trailguard.NodeInfo.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a NodeInfo message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {trailguard.NodeInfo & trailguard.NodeInfo.$Shape} NodeInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): trailguard.NodeInfo & trailguard.NodeInfo.$Shape;

        /**
         * Decodes a NodeInfo message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {trailguard.NodeInfo & trailguard.NodeInfo.$Shape} NodeInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): trailguard.NodeInfo & trailguard.NodeInfo.$Shape;

        /**
         * Verifies a NodeInfo message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a NodeInfo message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns NodeInfo
         */
        static fromObject(object: { [k: string]: any }): trailguard.NodeInfo;

        /**
         * Creates a plain object from a NodeInfo message. Also converts values to other types if specified.
         * @param message NodeInfo
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: trailguard.NodeInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this NodeInfo to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for NodeInfo
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace NodeInfo {

        /** Properties of a NodeInfo. */
        interface $Properties {

            /** NodeInfo nodeId */
            nodeId?: (string|null);

            /** NodeInfo latitude */
            latitude?: (number|null);

            /** NodeInfo longitude */
            longitude?: (number|null);

            /** NodeInfo batteryPct */
            batteryPct?: (number|null);

            /** NodeInfo solarMw */
            solarMw?: (number|null);

            /** NodeInfo lastSeenUnix */
            lastSeenUnix?: (number|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a NodeInfo. */
        type $Shape = trailguard.NodeInfo.$Properties;
    }

    /**
     * Properties of a CheckIn.
     * @deprecated Use trailguard.CheckIn.$Properties instead.
     */
    interface ICheckIn extends trailguard.CheckIn.$Properties {
    }

    /** Represents a CheckIn. */
    class CheckIn {

        /**
         * Constructs a new CheckIn.
         * @param [properties] Properties to set
         */
        constructor(properties?: trailguard.CheckIn.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** CheckIn hikerId. */
        hikerId: string;

        /** CheckIn nodeId. */
        nodeId: string;

        /** CheckIn timestampUnix. */
        timestampUnix: number;

        /** CheckIn signature. */
        signature: Uint8Array;

        /**
         * Creates a new CheckIn instance using the specified properties.
         * @param [properties] Properties to set
         * @returns CheckIn instance
         */
        static create(properties: trailguard.CheckIn.$Shape): trailguard.CheckIn & trailguard.CheckIn.$Shape;
        static create(properties?: trailguard.CheckIn.$Properties): trailguard.CheckIn;

        /**
         * Encodes the specified CheckIn message. Does not implicitly {@link trailguard.CheckIn.verify|verify} messages.
         * @param message CheckIn message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: trailguard.CheckIn.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified CheckIn message, length delimited. Does not implicitly {@link trailguard.CheckIn.verify|verify} messages.
         * @param message CheckIn message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: trailguard.CheckIn.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a CheckIn message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {trailguard.CheckIn & trailguard.CheckIn.$Shape} CheckIn
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): trailguard.CheckIn & trailguard.CheckIn.$Shape;

        /**
         * Decodes a CheckIn message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {trailguard.CheckIn & trailguard.CheckIn.$Shape} CheckIn
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): trailguard.CheckIn & trailguard.CheckIn.$Shape;

        /**
         * Verifies a CheckIn message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a CheckIn message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns CheckIn
         */
        static fromObject(object: { [k: string]: any }): trailguard.CheckIn;

        /**
         * Creates a plain object from a CheckIn message. Also converts values to other types if specified.
         * @param message CheckIn
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: trailguard.CheckIn, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this CheckIn to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for CheckIn
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace CheckIn {

        /** Properties of a CheckIn. */
        interface $Properties {

            /** CheckIn hikerId */
            hikerId?: (string|null);

            /** CheckIn nodeId */
            nodeId?: (string|null);

            /** CheckIn timestampUnix */
            timestampUnix?: (number|null);

            /** CheckIn signature */
            signature?: (Uint8Array|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a CheckIn. */
        type $Shape = trailguard.CheckIn.$Properties;
    }

    /**
     * Properties of a SOS.
     * @deprecated Use trailguard.SOS.$Properties instead.
     */
    interface ISOS extends trailguard.SOS.$Properties {
    }

    /** Represents a SOS. */
    class SOS {

        /**
         * Constructs a new SOS.
         * @param [properties] Properties to set
         */
        constructor(properties?: trailguard.SOS.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** SOS hikerId. */
        hikerId: string;

        /** SOS nodeId. */
        nodeId: string;

        /** SOS timestampUnix. */
        timestampUnix: number;

        /** SOS hikerLat. */
        hikerLat: number;

        /** SOS hikerLon. */
        hikerLon: number;

        /** SOS message. */
        message: string;

        /** SOS signature. */
        signature: Uint8Array;

        /**
         * Creates a new SOS instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SOS instance
         */
        static create(properties: trailguard.SOS.$Shape): trailguard.SOS & trailguard.SOS.$Shape;
        static create(properties?: trailguard.SOS.$Properties): trailguard.SOS;

        /**
         * Encodes the specified SOS message. Does not implicitly {@link trailguard.SOS.verify|verify} messages.
         * @param message SOS message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: trailguard.SOS.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SOS message, length delimited. Does not implicitly {@link trailguard.SOS.verify|verify} messages.
         * @param message SOS message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: trailguard.SOS.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SOS message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {trailguard.SOS & trailguard.SOS.$Shape} SOS
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): trailguard.SOS & trailguard.SOS.$Shape;

        /**
         * Decodes a SOS message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {trailguard.SOS & trailguard.SOS.$Shape} SOS
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): trailguard.SOS & trailguard.SOS.$Shape;

        /**
         * Verifies a SOS message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SOS message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SOS
         */
        static fromObject(object: { [k: string]: any }): trailguard.SOS;

        /**
         * Creates a plain object from a SOS message. Also converts values to other types if specified.
         * @param message SOS
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: trailguard.SOS, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SOS to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for SOS
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace SOS {

        /** Properties of a SOS. */
        interface $Properties {

            /** SOS hikerId */
            hikerId?: (string|null);

            /** SOS nodeId */
            nodeId?: (string|null);

            /** SOS timestampUnix */
            timestampUnix?: (number|null);

            /** SOS hikerLat */
            hikerLat?: (number|null);

            /** SOS hikerLon */
            hikerLon?: (number|null);

            /** SOS message */
            message?: (string|null);

            /** SOS signature */
            signature?: (Uint8Array|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a SOS. */
        type $Shape = trailguard.SOS.$Properties;
    }

    /** PresetCode enum. */
    enum PresetCode {

        /** PRESET_UNSPECIFIED value */
        PRESET_UNSPECIFIED = 0,

        /** ALL_OK_DELAYED value */
        ALL_OK_DELAYED = 1,

        /** MINOR_INJURY_MOBILE value */
        MINOR_INJURY_MOBILE = 2,

        /** LOW_ON_WATER_SUPPLIES value */
        LOW_ON_WATER_SUPPLIES = 3,

        /** WEATHER_TURNING_BACK value */
        WEATHER_TURNING_BACK = 4,

        /** NEED_NONURGENT_ASSIST value */
        NEED_NONURGENT_ASSIST = 5,

        /** CUSTOM_TEXT value */
        CUSTOM_TEXT = 15
    }

    /**
     * Properties of a TrailMessage.
     * @deprecated Use trailguard.TrailMessage.$Properties instead.
     */
    interface ITrailMessage extends trailguard.TrailMessage.$Properties {
    }

    /** Represents a TrailMessage. */
    class TrailMessage {

        /**
         * Constructs a new TrailMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: trailguard.TrailMessage.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** TrailMessage hikerId. */
        hikerId: string;

        /** TrailMessage nodeId. */
        nodeId: string;

        /** TrailMessage timestampUnix. */
        timestampUnix: number;

        /** TrailMessage preset. */
        preset: trailguard.PresetCode;

        /** TrailMessage freeText. */
        freeText: string;

        /** TrailMessage signature. */
        signature: Uint8Array;

        /**
         * Creates a new TrailMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns TrailMessage instance
         */
        static create(properties: trailguard.TrailMessage.$Shape): trailguard.TrailMessage & trailguard.TrailMessage.$Shape;
        static create(properties?: trailguard.TrailMessage.$Properties): trailguard.TrailMessage;

        /**
         * Encodes the specified TrailMessage message. Does not implicitly {@link trailguard.TrailMessage.verify|verify} messages.
         * @param message TrailMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: trailguard.TrailMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified TrailMessage message, length delimited. Does not implicitly {@link trailguard.TrailMessage.verify|verify} messages.
         * @param message TrailMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: trailguard.TrailMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a TrailMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {trailguard.TrailMessage & trailguard.TrailMessage.$Shape} TrailMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): trailguard.TrailMessage & trailguard.TrailMessage.$Shape;

        /**
         * Decodes a TrailMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {trailguard.TrailMessage & trailguard.TrailMessage.$Shape} TrailMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): trailguard.TrailMessage & trailguard.TrailMessage.$Shape;

        /**
         * Verifies a TrailMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a TrailMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns TrailMessage
         */
        static fromObject(object: { [k: string]: any }): trailguard.TrailMessage;

        /**
         * Creates a plain object from a TrailMessage message. Also converts values to other types if specified.
         * @param message TrailMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: trailguard.TrailMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this TrailMessage to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for TrailMessage
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace TrailMessage {

        /** Properties of a TrailMessage. */
        interface $Properties {

            /** TrailMessage hikerId */
            hikerId?: (string|null);

            /** TrailMessage nodeId */
            nodeId?: (string|null);

            /** TrailMessage timestampUnix */
            timestampUnix?: (number|null);

            /** TrailMessage preset */
            preset?: (trailguard.PresetCode|null);

            /** TrailMessage freeText */
            freeText?: (string|null);

            /** TrailMessage signature */
            signature?: (Uint8Array|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a TrailMessage. */
        type $Shape = trailguard.TrailMessage.$Properties;
    }

    /**
     * Properties of an Ack.
     * @deprecated Use trailguard.Ack.$Properties instead.
     */
    interface IAck extends trailguard.Ack.$Properties {
    }

    /** Represents an Ack. */
    class Ack {

        /**
         * Constructs a new Ack.
         * @param [properties] Properties to set
         */
        constructor(properties?: trailguard.Ack.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** Ack originalMessageId. */
        originalMessageId: string;

        /** Ack ackTimestampUnix. */
        ackTimestampUnix: number;

        /** Ack signature (Ed25519 over originalMessageId + ackTimestampUnix). */
        signature: (Uint8Array|null);

        /**
         * Creates a new Ack instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Ack instance
         */
        static create(properties: trailguard.Ack.$Shape): trailguard.Ack & trailguard.Ack.$Shape;
        static create(properties?: trailguard.Ack.$Properties): trailguard.Ack;

        /**
         * Encodes the specified Ack message. Does not implicitly {@link trailguard.Ack.verify|verify} messages.
         * @param message Ack message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: trailguard.Ack.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Ack message, length delimited. Does not implicitly {@link trailguard.Ack.verify|verify} messages.
         * @param message Ack message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: trailguard.Ack.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an Ack message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {trailguard.Ack & trailguard.Ack.$Shape} Ack
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): trailguard.Ack & trailguard.Ack.$Shape;

        /**
         * Decodes an Ack message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {trailguard.Ack & trailguard.Ack.$Shape} Ack
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): trailguard.Ack & trailguard.Ack.$Shape;

        /**
         * Verifies an Ack message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an Ack message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Ack
         */
        static fromObject(object: { [k: string]: any }): trailguard.Ack;

        /**
         * Creates a plain object from an Ack message. Also converts values to other types if specified.
         * @param message Ack
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: trailguard.Ack, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Ack to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for Ack
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace Ack {

        /** Properties of an Ack. */
        interface $Properties {

            /** Ack originalMessageId */
            originalMessageId?: (string|null);

            /** Ack ackTimestampUnix */
            ackTimestampUnix?: (number|null);

            /** Ack signature */
            signature?: (Uint8Array|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of an Ack. */
        type $Shape = trailguard.Ack.$Properties;
    }
}
