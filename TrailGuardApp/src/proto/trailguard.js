/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-mixed-operators, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars, default-case, jsdoc/require-param*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;
var $Object = $util.global.Object, $undefined = $util.global.undefined, $Error = $util.global.Error, $RangeError = $util.global.RangeError, $TypeError = $util.global.TypeError, $String = $util.global.String, $Number = $util.global.Number, $isFinite = $util.global.isFinite, $Array = $util.global.Array;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.trailguard = (function() {

    /**
     * Namespace trailguard.
     * @exports trailguard
     * @namespace
     */
    var trailguard = {};

    trailguard.NodeInfo = (function() {

        /**
         * Properties of a NodeInfo.
         * @typedef {Object} trailguard.NodeInfo.$Properties
         * @property {string|null} [nodeId] NodeInfo nodeId
         * @property {number|null} [latitude] NodeInfo latitude
         * @property {number|null} [longitude] NodeInfo longitude
         * @property {number|null} [batteryPct] NodeInfo batteryPct
         * @property {number|null} [solarMw] NodeInfo solarMw
         * @property {number|null} [lastSeenUnix] NodeInfo lastSeenUnix
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a NodeInfo.
         * @memberof trailguard
         * @interface INodeInfo
         * @augments trailguard.NodeInfo.$Properties
         * @deprecated Use trailguard.NodeInfo.$Properties instead.
         */

        /**
         * Shape of a NodeInfo.
         * @typedef {trailguard.NodeInfo.$Properties} trailguard.NodeInfo.$Shape
         */

        /**
         * Constructs a new NodeInfo.
         * @memberof trailguard
         * @classdesc Represents a NodeInfo.
         * @constructor
         * @param {trailguard.NodeInfo.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var NodeInfo = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * NodeInfo nodeId.
         * @member {string} nodeId
         * @memberof trailguard.NodeInfo
         * @instance
         */
        NodeInfo.prototype.nodeId = "";

        /**
         * NodeInfo latitude.
         * @member {number} latitude
         * @memberof trailguard.NodeInfo
         * @instance
         */
        NodeInfo.prototype.latitude = 0;

        /**
         * NodeInfo longitude.
         * @member {number} longitude
         * @memberof trailguard.NodeInfo
         * @instance
         */
        NodeInfo.prototype.longitude = 0;

        /**
         * NodeInfo batteryPct.
         * @member {number} batteryPct
         * @memberof trailguard.NodeInfo
         * @instance
         */
        NodeInfo.prototype.batteryPct = 0;

        /**
         * NodeInfo solarMw.
         * @member {number} solarMw
         * @memberof trailguard.NodeInfo
         * @instance
         */
        NodeInfo.prototype.solarMw = 0;

        /**
         * NodeInfo lastSeenUnix.
         * @member {number} lastSeenUnix
         * @memberof trailguard.NodeInfo
         * @instance
         */
        NodeInfo.prototype.lastSeenUnix = 0;

        /**
         * Creates a new NodeInfo instance using the specified properties.
         * @function create
         * @memberof trailguard.NodeInfo
         * @static
         * @param {trailguard.NodeInfo.$Properties=} [properties] Properties to set
         * @returns {trailguard.NodeInfo} NodeInfo instance
         * @type {{
         *   (properties: trailguard.NodeInfo.$Shape): trailguard.NodeInfo & trailguard.NodeInfo.$Shape;
         *   (properties?: trailguard.NodeInfo.$Properties): trailguard.NodeInfo;
         * }}
         */
        NodeInfo.create = function(properties) {
            return new NodeInfo(properties);
        };

        /**
         * Encodes the specified NodeInfo message. Does not implicitly {@link trailguard.NodeInfo.verify|verify} messages.
         * @function encode
         * @memberof trailguard.NodeInfo
         * @static
         * @param {trailguard.NodeInfo.$Properties} message NodeInfo message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        NodeInfo.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.nodeId != null && $Object.hasOwnProperty.call(message, "nodeId") && message.nodeId !== "")
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.nodeId);
            if (message.latitude != null && $Object.hasOwnProperty.call(message, "latitude") && !$Object.is(message.latitude, 0))
                writer.uint32(/* id 2, wireType 1 =*/17).double(message.latitude);
            if (message.longitude != null && $Object.hasOwnProperty.call(message, "longitude") && !$Object.is(message.longitude, 0))
                writer.uint32(/* id 3, wireType 1 =*/25).double(message.longitude);
            if (message.batteryPct != null && $Object.hasOwnProperty.call(message, "batteryPct") && !$Object.is(message.batteryPct, 0))
                writer.uint32(/* id 4, wireType 5 =*/37).float(message.batteryPct);
            if (message.solarMw != null && $Object.hasOwnProperty.call(message, "solarMw") && !$Object.is(message.solarMw, 0))
                writer.uint32(/* id 5, wireType 5 =*/45).float(message.solarMw);
            if (message.lastSeenUnix != null && $Object.hasOwnProperty.call(message, "lastSeenUnix") && message.lastSeenUnix !== 0)
                writer.uint32(/* id 6, wireType 0 =*/48).uint32(message.lastSeenUnix);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified NodeInfo message, length delimited. Does not implicitly {@link trailguard.NodeInfo.verify|verify} messages.
         * @function encodeDelimited
         * @memberof trailguard.NodeInfo
         * @static
         * @param {trailguard.NodeInfo.$Properties} message NodeInfo message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        NodeInfo.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a NodeInfo message from the specified reader or buffer.
         * @function decode
         * @memberof trailguard.NodeInfo
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {trailguard.NodeInfo & trailguard.NodeInfo.$Shape} NodeInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        NodeInfo.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.trailguard.NodeInfo();
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.nodeId = value;
                        else
                            delete message.nodeId;
                        continue;
                    }
                case 2: {
                        if (wireType !== 1)
                            break;
                        if (!$Object.is(value = reader.double(), 0))
                            message.latitude = value;
                        else
                            delete message.latitude;
                        continue;
                    }
                case 3: {
                        if (wireType !== 1)
                            break;
                        if (!$Object.is(value = reader.double(), 0))
                            message.longitude = value;
                        else
                            delete message.longitude;
                        continue;
                    }
                case 4: {
                        if (wireType !== 5)
                            break;
                        if (!$Object.is(value = reader.float(), 0))
                            message.batteryPct = value;
                        else
                            delete message.batteryPct;
                        continue;
                    }
                case 5: {
                        if (wireType !== 5)
                            break;
                        if (!$Object.is(value = reader.float(), 0))
                            message.solarMw = value;
                        else
                            delete message.solarMw;
                        continue;
                    }
                case 6: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.uint32())
                            message.lastSeenUnix = value;
                        else
                            delete message.lastSeenUnix;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a NodeInfo message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof trailguard.NodeInfo
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {trailguard.NodeInfo & trailguard.NodeInfo.$Shape} NodeInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        NodeInfo.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a NodeInfo message.
         * @function verify
         * @memberof trailguard.NodeInfo
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        NodeInfo.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.nodeId != null && $Object.hasOwnProperty.call(message, "nodeId"))
                if (!$util.isString(message.nodeId))
                    return "nodeId: string expected";
            if (message.latitude != null && $Object.hasOwnProperty.call(message, "latitude"))
                if (typeof message.latitude !== "number")
                    return "latitude: number expected";
            if (message.longitude != null && $Object.hasOwnProperty.call(message, "longitude"))
                if (typeof message.longitude !== "number")
                    return "longitude: number expected";
            if (message.batteryPct != null && $Object.hasOwnProperty.call(message, "batteryPct"))
                if (typeof message.batteryPct !== "number")
                    return "batteryPct: number expected";
            if (message.solarMw != null && $Object.hasOwnProperty.call(message, "solarMw"))
                if (typeof message.solarMw !== "number")
                    return "solarMw: number expected";
            if (message.lastSeenUnix != null && $Object.hasOwnProperty.call(message, "lastSeenUnix"))
                if (!$util.isInteger(message.lastSeenUnix))
                    return "lastSeenUnix: integer expected";
            return null;
        };

        /**
         * Creates a NodeInfo message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof trailguard.NodeInfo
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {trailguard.NodeInfo} NodeInfo
         */
        NodeInfo.fromObject = function (object, _depth) {
            if (object instanceof $root.trailguard.NodeInfo)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".trailguard.NodeInfo: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.trailguard.NodeInfo();
            if (object.nodeId != null)
                if (typeof object.nodeId !== "string" || object.nodeId.length)
                    message.nodeId = $String(object.nodeId);
            if (object.latitude != null)
                if (!$Object.is($Number(object.latitude), 0))
                    message.latitude = $Number(object.latitude);
            if (object.longitude != null)
                if (!$Object.is($Number(object.longitude), 0))
                    message.longitude = $Number(object.longitude);
            if (object.batteryPct != null)
                if (!$Object.is($Number(object.batteryPct), 0))
                    message.batteryPct = $Number(object.batteryPct);
            if (object.solarMw != null)
                if (!$Object.is($Number(object.solarMw), 0))
                    message.solarMw = $Number(object.solarMw);
            if (object.lastSeenUnix != null)
                if ($Number(object.lastSeenUnix) !== 0)
                    message.lastSeenUnix = object.lastSeenUnix >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a NodeInfo message. Also converts values to other types if specified.
         * @function toObject
         * @memberof trailguard.NodeInfo
         * @static
         * @param {trailguard.NodeInfo} message NodeInfo
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        NodeInfo.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                object.nodeId = "";
                object.latitude = 0;
                object.longitude = 0;
                object.batteryPct = 0;
                object.solarMw = 0;
                object.lastSeenUnix = 0;
            }
            if (message.nodeId != null && $Object.hasOwnProperty.call(message, "nodeId"))
                object.nodeId = message.nodeId;
            if (message.latitude != null && $Object.hasOwnProperty.call(message, "latitude"))
                object.latitude = options.json && !$isFinite(message.latitude) ? $String(message.latitude) : message.latitude;
            if (message.longitude != null && $Object.hasOwnProperty.call(message, "longitude"))
                object.longitude = options.json && !$isFinite(message.longitude) ? $String(message.longitude) : message.longitude;
            if (message.batteryPct != null && $Object.hasOwnProperty.call(message, "batteryPct"))
                object.batteryPct = options.json && !$isFinite(message.batteryPct) ? $String(message.batteryPct) : message.batteryPct;
            if (message.solarMw != null && $Object.hasOwnProperty.call(message, "solarMw"))
                object.solarMw = options.json && !$isFinite(message.solarMw) ? $String(message.solarMw) : message.solarMw;
            if (message.lastSeenUnix != null && $Object.hasOwnProperty.call(message, "lastSeenUnix"))
                object.lastSeenUnix = message.lastSeenUnix;
            return object;
        };

        /**
         * Converts this NodeInfo to JSON.
         * @function toJSON
         * @memberof trailguard.NodeInfo
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        NodeInfo.prototype.toJSON = function() {
            return NodeInfo.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for NodeInfo
         * @function getTypeUrl
         * @memberof trailguard.NodeInfo
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        NodeInfo.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/trailguard.NodeInfo";
        };

        return NodeInfo;
    })();

    trailguard.CheckIn = (function() {

        /**
         * Properties of a CheckIn.
         * @typedef {Object} trailguard.CheckIn.$Properties
         * @property {string|null} [hikerId] CheckIn hikerId
         * @property {string|null} [nodeId] CheckIn nodeId
         * @property {number|null} [timestampUnix] CheckIn timestampUnix
         * @property {Uint8Array|null} [signature] CheckIn signature
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a CheckIn.
         * @memberof trailguard
         * @interface ICheckIn
         * @augments trailguard.CheckIn.$Properties
         * @deprecated Use trailguard.CheckIn.$Properties instead.
         */

        /**
         * Shape of a CheckIn.
         * @typedef {trailguard.CheckIn.$Properties} trailguard.CheckIn.$Shape
         */

        /**
         * Constructs a new CheckIn.
         * @memberof trailguard
         * @classdesc Represents a CheckIn.
         * @constructor
         * @param {trailguard.CheckIn.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var CheckIn = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * CheckIn hikerId.
         * @member {string} hikerId
         * @memberof trailguard.CheckIn
         * @instance
         */
        CheckIn.prototype.hikerId = "";

        /**
         * CheckIn nodeId.
         * @member {string} nodeId
         * @memberof trailguard.CheckIn
         * @instance
         */
        CheckIn.prototype.nodeId = "";

        /**
         * CheckIn timestampUnix.
         * @member {number} timestampUnix
         * @memberof trailguard.CheckIn
         * @instance
         */
        CheckIn.prototype.timestampUnix = 0;

        /**
         * CheckIn signature.
         * @member {Uint8Array} signature
         * @memberof trailguard.CheckIn
         * @instance
         */
        CheckIn.prototype.signature = $util.newBuffer([]);

        /**
         * Creates a new CheckIn instance using the specified properties.
         * @function create
         * @memberof trailguard.CheckIn
         * @static
         * @param {trailguard.CheckIn.$Properties=} [properties] Properties to set
         * @returns {trailguard.CheckIn} CheckIn instance
         * @type {{
         *   (properties: trailguard.CheckIn.$Shape): trailguard.CheckIn & trailguard.CheckIn.$Shape;
         *   (properties?: trailguard.CheckIn.$Properties): trailguard.CheckIn;
         * }}
         */
        CheckIn.create = function(properties) {
            return new CheckIn(properties);
        };

        /**
         * Encodes the specified CheckIn message. Does not implicitly {@link trailguard.CheckIn.verify|verify} messages.
         * @function encode
         * @memberof trailguard.CheckIn
         * @static
         * @param {trailguard.CheckIn.$Properties} message CheckIn message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CheckIn.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.hikerId != null && $Object.hasOwnProperty.call(message, "hikerId") && message.hikerId !== "")
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.hikerId);
            if (message.nodeId != null && $Object.hasOwnProperty.call(message, "nodeId") && message.nodeId !== "")
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.nodeId);
            if (message.timestampUnix != null && $Object.hasOwnProperty.call(message, "timestampUnix") && message.timestampUnix !== 0)
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.timestampUnix);
            if (message.signature != null && $Object.hasOwnProperty.call(message, "signature") && message.signature.length)
                writer.uint32(/* id 4, wireType 2 =*/34).bytes(message.signature);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified CheckIn message, length delimited. Does not implicitly {@link trailguard.CheckIn.verify|verify} messages.
         * @function encodeDelimited
         * @memberof trailguard.CheckIn
         * @static
         * @param {trailguard.CheckIn.$Properties} message CheckIn message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CheckIn.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a CheckIn message from the specified reader or buffer.
         * @function decode
         * @memberof trailguard.CheckIn
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {trailguard.CheckIn & trailguard.CheckIn.$Shape} CheckIn
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CheckIn.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.trailguard.CheckIn();
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.hikerId = value;
                        else
                            delete message.hikerId;
                        continue;
                    }
                case 2: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.nodeId = value;
                        else
                            delete message.nodeId;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.uint32())
                            message.timestampUnix = value;
                        else
                            delete message.timestampUnix;
                        continue;
                    }
                case 4: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.bytes()).length)
                            message.signature = value;
                        else
                            delete message.signature;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a CheckIn message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof trailguard.CheckIn
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {trailguard.CheckIn & trailguard.CheckIn.$Shape} CheckIn
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CheckIn.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a CheckIn message.
         * @function verify
         * @memberof trailguard.CheckIn
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        CheckIn.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.hikerId != null && $Object.hasOwnProperty.call(message, "hikerId"))
                if (!$util.isString(message.hikerId))
                    return "hikerId: string expected";
            if (message.nodeId != null && $Object.hasOwnProperty.call(message, "nodeId"))
                if (!$util.isString(message.nodeId))
                    return "nodeId: string expected";
            if (message.timestampUnix != null && $Object.hasOwnProperty.call(message, "timestampUnix"))
                if (!$util.isInteger(message.timestampUnix))
                    return "timestampUnix: integer expected";
            if (message.signature != null && $Object.hasOwnProperty.call(message, "signature"))
                if (!(message.signature && typeof message.signature.length === "number" || $util.isString(message.signature)))
                    return "signature: buffer expected";
            return null;
        };

        /**
         * Creates a CheckIn message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof trailguard.CheckIn
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {trailguard.CheckIn} CheckIn
         */
        CheckIn.fromObject = function (object, _depth) {
            if (object instanceof $root.trailguard.CheckIn)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".trailguard.CheckIn: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.trailguard.CheckIn();
            if (object.hikerId != null)
                if (typeof object.hikerId !== "string" || object.hikerId.length)
                    message.hikerId = $String(object.hikerId);
            if (object.nodeId != null)
                if (typeof object.nodeId !== "string" || object.nodeId.length)
                    message.nodeId = $String(object.nodeId);
            if (object.timestampUnix != null)
                if ($Number(object.timestampUnix) !== 0)
                    message.timestampUnix = object.timestampUnix >>> 0;
            if (object.signature != null)
                if (object.signature.length)
                    if (typeof object.signature === "string")
                        $util.base64.decode(object.signature, message.signature = $util.newBuffer($util.base64.length(object.signature)), 0);
                    else if (object.signature.length >= 0)
                        message.signature = object.signature;
            return message;
        };

        /**
         * Creates a plain object from a CheckIn message. Also converts values to other types if specified.
         * @function toObject
         * @memberof trailguard.CheckIn
         * @static
         * @param {trailguard.CheckIn} message CheckIn
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        CheckIn.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                object.hikerId = "";
                object.nodeId = "";
                object.timestampUnix = 0;
                if (options.bytes === $String)
                    object.signature = "";
                else {
                    object.signature = [];
                    if (options.bytes !== $Array)
                        object.signature = $util.newBuffer(object.signature);
                }
            }
            if (message.hikerId != null && $Object.hasOwnProperty.call(message, "hikerId"))
                object.hikerId = message.hikerId;
            if (message.nodeId != null && $Object.hasOwnProperty.call(message, "nodeId"))
                object.nodeId = message.nodeId;
            if (message.timestampUnix != null && $Object.hasOwnProperty.call(message, "timestampUnix"))
                object.timestampUnix = message.timestampUnix;
            if (message.signature != null && $Object.hasOwnProperty.call(message, "signature"))
                object.signature = options.bytes === $String ? $util.base64.encode(message.signature, 0, message.signature.length) : options.bytes === $Array ? $Array.prototype.slice.call(message.signature) : message.signature;
            return object;
        };

        /**
         * Converts this CheckIn to JSON.
         * @function toJSON
         * @memberof trailguard.CheckIn
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        CheckIn.prototype.toJSON = function() {
            return CheckIn.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for CheckIn
         * @function getTypeUrl
         * @memberof trailguard.CheckIn
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        CheckIn.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/trailguard.CheckIn";
        };

        return CheckIn;
    })();

    trailguard.SOS = (function() {

        /**
         * Properties of a SOS.
         * @typedef {Object} trailguard.SOS.$Properties
         * @property {string|null} [hikerId] SOS hikerId
         * @property {string|null} [nodeId] SOS nodeId
         * @property {number|null} [timestampUnix] SOS timestampUnix
         * @property {number|null} [hikerLat] SOS hikerLat
         * @property {number|null} [hikerLon] SOS hikerLon
         * @property {string|null} [message] SOS message
         * @property {Uint8Array|null} [signature] SOS signature
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a SOS.
         * @memberof trailguard
         * @interface ISOS
         * @augments trailguard.SOS.$Properties
         * @deprecated Use trailguard.SOS.$Properties instead.
         */

        /**
         * Shape of a SOS.
         * @typedef {trailguard.SOS.$Properties} trailguard.SOS.$Shape
         */

        /**
         * Constructs a new SOS.
         * @memberof trailguard
         * @classdesc Represents a SOS.
         * @constructor
         * @param {trailguard.SOS.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var SOS = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * SOS hikerId.
         * @member {string} hikerId
         * @memberof trailguard.SOS
         * @instance
         */
        SOS.prototype.hikerId = "";

        /**
         * SOS nodeId.
         * @member {string} nodeId
         * @memberof trailguard.SOS
         * @instance
         */
        SOS.prototype.nodeId = "";

        /**
         * SOS timestampUnix.
         * @member {number} timestampUnix
         * @memberof trailguard.SOS
         * @instance
         */
        SOS.prototype.timestampUnix = 0;

        /**
         * SOS hikerLat.
         * @member {number} hikerLat
         * @memberof trailguard.SOS
         * @instance
         */
        SOS.prototype.hikerLat = 0;

        /**
         * SOS hikerLon.
         * @member {number} hikerLon
         * @memberof trailguard.SOS
         * @instance
         */
        SOS.prototype.hikerLon = 0;

        /**
         * SOS message.
         * @member {string} message
         * @memberof trailguard.SOS
         * @instance
         */
        SOS.prototype.message = "";

        /**
         * SOS signature.
         * @member {Uint8Array} signature
         * @memberof trailguard.SOS
         * @instance
         */
        SOS.prototype.signature = $util.newBuffer([]);

        /**
         * Creates a new SOS instance using the specified properties.
         * @function create
         * @memberof trailguard.SOS
         * @static
         * @param {trailguard.SOS.$Properties=} [properties] Properties to set
         * @returns {trailguard.SOS} SOS instance
         * @type {{
         *   (properties: trailguard.SOS.$Shape): trailguard.SOS & trailguard.SOS.$Shape;
         *   (properties?: trailguard.SOS.$Properties): trailguard.SOS;
         * }}
         */
        SOS.create = function(properties) {
            return new SOS(properties);
        };

        /**
         * Encodes the specified SOS message. Does not implicitly {@link trailguard.SOS.verify|verify} messages.
         * @function encode
         * @memberof trailguard.SOS
         * @static
         * @param {trailguard.SOS.$Properties} message SOS message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SOS.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.hikerId != null && $Object.hasOwnProperty.call(message, "hikerId") && message.hikerId !== "")
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.hikerId);
            if (message.nodeId != null && $Object.hasOwnProperty.call(message, "nodeId") && message.nodeId !== "")
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.nodeId);
            if (message.timestampUnix != null && $Object.hasOwnProperty.call(message, "timestampUnix") && message.timestampUnix !== 0)
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.timestampUnix);
            if (message.hikerLat != null && $Object.hasOwnProperty.call(message, "hikerLat") && !$Object.is(message.hikerLat, 0))
                writer.uint32(/* id 4, wireType 1 =*/33).double(message.hikerLat);
            if (message.hikerLon != null && $Object.hasOwnProperty.call(message, "hikerLon") && !$Object.is(message.hikerLon, 0))
                writer.uint32(/* id 5, wireType 1 =*/41).double(message.hikerLon);
            if (message.message != null && $Object.hasOwnProperty.call(message, "message") && message.message !== "")
                writer.uint32(/* id 6, wireType 2 =*/50).string(message.message);
            if (message.signature != null && $Object.hasOwnProperty.call(message, "signature") && message.signature.length)
                writer.uint32(/* id 7, wireType 2 =*/58).bytes(message.signature);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified SOS message, length delimited. Does not implicitly {@link trailguard.SOS.verify|verify} messages.
         * @function encodeDelimited
         * @memberof trailguard.SOS
         * @static
         * @param {trailguard.SOS.$Properties} message SOS message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SOS.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a SOS message from the specified reader or buffer.
         * @function decode
         * @memberof trailguard.SOS
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {trailguard.SOS & trailguard.SOS.$Shape} SOS
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SOS.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.trailguard.SOS();
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.hikerId = value;
                        else
                            delete message.hikerId;
                        continue;
                    }
                case 2: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.nodeId = value;
                        else
                            delete message.nodeId;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.uint32())
                            message.timestampUnix = value;
                        else
                            delete message.timestampUnix;
                        continue;
                    }
                case 4: {
                        if (wireType !== 1)
                            break;
                        if (!$Object.is(value = reader.double(), 0))
                            message.hikerLat = value;
                        else
                            delete message.hikerLat;
                        continue;
                    }
                case 5: {
                        if (wireType !== 1)
                            break;
                        if (!$Object.is(value = reader.double(), 0))
                            message.hikerLon = value;
                        else
                            delete message.hikerLon;
                        continue;
                    }
                case 6: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.message = value;
                        else
                            delete message.message;
                        continue;
                    }
                case 7: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.bytes()).length)
                            message.signature = value;
                        else
                            delete message.signature;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a SOS message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof trailguard.SOS
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {trailguard.SOS & trailguard.SOS.$Shape} SOS
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SOS.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SOS message.
         * @function verify
         * @memberof trailguard.SOS
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SOS.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.hikerId != null && $Object.hasOwnProperty.call(message, "hikerId"))
                if (!$util.isString(message.hikerId))
                    return "hikerId: string expected";
            if (message.nodeId != null && $Object.hasOwnProperty.call(message, "nodeId"))
                if (!$util.isString(message.nodeId))
                    return "nodeId: string expected";
            if (message.timestampUnix != null && $Object.hasOwnProperty.call(message, "timestampUnix"))
                if (!$util.isInteger(message.timestampUnix))
                    return "timestampUnix: integer expected";
            if (message.hikerLat != null && $Object.hasOwnProperty.call(message, "hikerLat"))
                if (typeof message.hikerLat !== "number")
                    return "hikerLat: number expected";
            if (message.hikerLon != null && $Object.hasOwnProperty.call(message, "hikerLon"))
                if (typeof message.hikerLon !== "number")
                    return "hikerLon: number expected";
            if (message.message != null && $Object.hasOwnProperty.call(message, "message"))
                if (!$util.isString(message.message))
                    return "message: string expected";
            if (message.signature != null && $Object.hasOwnProperty.call(message, "signature"))
                if (!(message.signature && typeof message.signature.length === "number" || $util.isString(message.signature)))
                    return "signature: buffer expected";
            return null;
        };

        /**
         * Creates a SOS message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof trailguard.SOS
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {trailguard.SOS} SOS
         */
        SOS.fromObject = function (object, _depth) {
            if (object instanceof $root.trailguard.SOS)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".trailguard.SOS: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.trailguard.SOS();
            if (object.hikerId != null)
                if (typeof object.hikerId !== "string" || object.hikerId.length)
                    message.hikerId = $String(object.hikerId);
            if (object.nodeId != null)
                if (typeof object.nodeId !== "string" || object.nodeId.length)
                    message.nodeId = $String(object.nodeId);
            if (object.timestampUnix != null)
                if ($Number(object.timestampUnix) !== 0)
                    message.timestampUnix = object.timestampUnix >>> 0;
            if (object.hikerLat != null)
                if (!$Object.is($Number(object.hikerLat), 0))
                    message.hikerLat = $Number(object.hikerLat);
            if (object.hikerLon != null)
                if (!$Object.is($Number(object.hikerLon), 0))
                    message.hikerLon = $Number(object.hikerLon);
            if (object.message != null)
                if (typeof object.message !== "string" || object.message.length)
                    message.message = $String(object.message);
            if (object.signature != null)
                if (object.signature.length)
                    if (typeof object.signature === "string")
                        $util.base64.decode(object.signature, message.signature = $util.newBuffer($util.base64.length(object.signature)), 0);
                    else if (object.signature.length >= 0)
                        message.signature = object.signature;
            return message;
        };

        /**
         * Creates a plain object from a SOS message. Also converts values to other types if specified.
         * @function toObject
         * @memberof trailguard.SOS
         * @static
         * @param {trailguard.SOS} message SOS
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SOS.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                object.hikerId = "";
                object.nodeId = "";
                object.timestampUnix = 0;
                object.hikerLat = 0;
                object.hikerLon = 0;
                object.message = "";
                if (options.bytes === $String)
                    object.signature = "";
                else {
                    object.signature = [];
                    if (options.bytes !== $Array)
                        object.signature = $util.newBuffer(object.signature);
                }
            }
            if (message.hikerId != null && $Object.hasOwnProperty.call(message, "hikerId"))
                object.hikerId = message.hikerId;
            if (message.nodeId != null && $Object.hasOwnProperty.call(message, "nodeId"))
                object.nodeId = message.nodeId;
            if (message.timestampUnix != null && $Object.hasOwnProperty.call(message, "timestampUnix"))
                object.timestampUnix = message.timestampUnix;
            if (message.hikerLat != null && $Object.hasOwnProperty.call(message, "hikerLat"))
                object.hikerLat = options.json && !$isFinite(message.hikerLat) ? $String(message.hikerLat) : message.hikerLat;
            if (message.hikerLon != null && $Object.hasOwnProperty.call(message, "hikerLon"))
                object.hikerLon = options.json && !$isFinite(message.hikerLon) ? $String(message.hikerLon) : message.hikerLon;
            if (message.message != null && $Object.hasOwnProperty.call(message, "message"))
                object.message = message.message;
            if (message.signature != null && $Object.hasOwnProperty.call(message, "signature"))
                object.signature = options.bytes === $String ? $util.base64.encode(message.signature, 0, message.signature.length) : options.bytes === $Array ? $Array.prototype.slice.call(message.signature) : message.signature;
            return object;
        };

        /**
         * Converts this SOS to JSON.
         * @function toJSON
         * @memberof trailguard.SOS
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SOS.prototype.toJSON = function() {
            return SOS.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for SOS
         * @function getTypeUrl
         * @memberof trailguard.SOS
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        SOS.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/trailguard.SOS";
        };

        return SOS;
    })();

    /**
     * PresetCode enum.
     * @name trailguard.PresetCode
     * @enum {number}
     * @property {number} PRESET_UNSPECIFIED=0 PRESET_UNSPECIFIED value
     * @property {number} ALL_OK_DELAYED=1 ALL_OK_DELAYED value
     * @property {number} MINOR_INJURY_MOBILE=2 MINOR_INJURY_MOBILE value
     * @property {number} LOW_ON_WATER_SUPPLIES=3 LOW_ON_WATER_SUPPLIES value
     * @property {number} WEATHER_TURNING_BACK=4 WEATHER_TURNING_BACK value
     * @property {number} NEED_NONURGENT_ASSIST=5 NEED_NONURGENT_ASSIST value
     * @property {number} CUSTOM_TEXT=15 CUSTOM_TEXT value
     */
    trailguard.PresetCode = (function() {
        var valuesById = $Object.create(null), values = $Object.create(valuesById);
        values[valuesById[0] = "PRESET_UNSPECIFIED"] = 0;
        values[valuesById[1] = "ALL_OK_DELAYED"] = 1;
        values[valuesById[2] = "MINOR_INJURY_MOBILE"] = 2;
        values[valuesById[3] = "LOW_ON_WATER_SUPPLIES"] = 3;
        values[valuesById[4] = "WEATHER_TURNING_BACK"] = 4;
        values[valuesById[5] = "NEED_NONURGENT_ASSIST"] = 5;
        values[valuesById[15] = "CUSTOM_TEXT"] = 15;
        return values;
    })();

    trailguard.TrailMessage = (function() {

        /**
         * Properties of a TrailMessage.
         * @typedef {Object} trailguard.TrailMessage.$Properties
         * @property {string|null} [hikerId] TrailMessage hikerId
         * @property {string|null} [nodeId] TrailMessage nodeId
         * @property {number|null} [timestampUnix] TrailMessage timestampUnix
         * @property {trailguard.PresetCode|null} [preset] TrailMessage preset
         * @property {string|null} [freeText] TrailMessage freeText
         * @property {Uint8Array|null} [signature] TrailMessage signature
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a TrailMessage.
         * @memberof trailguard
         * @interface ITrailMessage
         * @augments trailguard.TrailMessage.$Properties
         * @deprecated Use trailguard.TrailMessage.$Properties instead.
         */

        /**
         * Shape of a TrailMessage.
         * @typedef {trailguard.TrailMessage.$Properties} trailguard.TrailMessage.$Shape
         */

        /**
         * Constructs a new TrailMessage.
         * @memberof trailguard
         * @classdesc Represents a TrailMessage.
         * @constructor
         * @param {trailguard.TrailMessage.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var TrailMessage = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * TrailMessage hikerId.
         * @member {string} hikerId
         * @memberof trailguard.TrailMessage
         * @instance
         */
        TrailMessage.prototype.hikerId = "";

        /**
         * TrailMessage nodeId.
         * @member {string} nodeId
         * @memberof trailguard.TrailMessage
         * @instance
         */
        TrailMessage.prototype.nodeId = "";

        /**
         * TrailMessage timestampUnix.
         * @member {number} timestampUnix
         * @memberof trailguard.TrailMessage
         * @instance
         */
        TrailMessage.prototype.timestampUnix = 0;

        /**
         * TrailMessage preset.
         * @member {trailguard.PresetCode} preset
         * @memberof trailguard.TrailMessage
         * @instance
         */
        TrailMessage.prototype.preset = 0;

        /**
         * TrailMessage freeText.
         * @member {string} freeText
         * @memberof trailguard.TrailMessage
         * @instance
         */
        TrailMessage.prototype.freeText = "";

        /**
         * TrailMessage signature.
         * @member {Uint8Array} signature
         * @memberof trailguard.TrailMessage
         * @instance
         */
        TrailMessage.prototype.signature = $util.newBuffer([]);

        /**
         * Creates a new TrailMessage instance using the specified properties.
         * @function create
         * @memberof trailguard.TrailMessage
         * @static
         * @param {trailguard.TrailMessage.$Properties=} [properties] Properties to set
         * @returns {trailguard.TrailMessage} TrailMessage instance
         * @type {{
         *   (properties: trailguard.TrailMessage.$Shape): trailguard.TrailMessage & trailguard.TrailMessage.$Shape;
         *   (properties?: trailguard.TrailMessage.$Properties): trailguard.TrailMessage;
         * }}
         */
        TrailMessage.create = function(properties) {
            return new TrailMessage(properties);
        };

        /**
         * Encodes the specified TrailMessage message. Does not implicitly {@link trailguard.TrailMessage.verify|verify} messages.
         * @function encode
         * @memberof trailguard.TrailMessage
         * @static
         * @param {trailguard.TrailMessage.$Properties} message TrailMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TrailMessage.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.hikerId != null && $Object.hasOwnProperty.call(message, "hikerId") && message.hikerId !== "")
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.hikerId);
            if (message.nodeId != null && $Object.hasOwnProperty.call(message, "nodeId") && message.nodeId !== "")
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.nodeId);
            if (message.timestampUnix != null && $Object.hasOwnProperty.call(message, "timestampUnix") && message.timestampUnix !== 0)
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.timestampUnix);
            if (message.preset != null && $Object.hasOwnProperty.call(message, "preset") && message.preset !== 0)
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.preset);
            if (message.freeText != null && $Object.hasOwnProperty.call(message, "freeText") && message.freeText !== "")
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.freeText);
            if (message.signature != null && $Object.hasOwnProperty.call(message, "signature") && message.signature.length)
                writer.uint32(/* id 6, wireType 2 =*/50).bytes(message.signature);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified TrailMessage message, length delimited. Does not implicitly {@link trailguard.TrailMessage.verify|verify} messages.
         * @function encodeDelimited
         * @memberof trailguard.TrailMessage
         * @static
         * @param {trailguard.TrailMessage.$Properties} message TrailMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        TrailMessage.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a TrailMessage message from the specified reader or buffer.
         * @function decode
         * @memberof trailguard.TrailMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {trailguard.TrailMessage & trailguard.TrailMessage.$Shape} TrailMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TrailMessage.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.trailguard.TrailMessage();
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.hikerId = value;
                        else
                            delete message.hikerId;
                        continue;
                    }
                case 2: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.nodeId = value;
                        else
                            delete message.nodeId;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.uint32())
                            message.timestampUnix = value;
                        else
                            delete message.timestampUnix;
                        continue;
                    }
                case 4: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.preset = value;
                        else
                            delete message.preset;
                        continue;
                    }
                case 5: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.freeText = value;
                        else
                            delete message.freeText;
                        continue;
                    }
                case 6: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.bytes()).length)
                            message.signature = value;
                        else
                            delete message.signature;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a TrailMessage message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof trailguard.TrailMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {trailguard.TrailMessage & trailguard.TrailMessage.$Shape} TrailMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        TrailMessage.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a TrailMessage message.
         * @function verify
         * @memberof trailguard.TrailMessage
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        TrailMessage.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.hikerId != null && $Object.hasOwnProperty.call(message, "hikerId"))
                if (!$util.isString(message.hikerId))
                    return "hikerId: string expected";
            if (message.nodeId != null && $Object.hasOwnProperty.call(message, "nodeId"))
                if (!$util.isString(message.nodeId))
                    return "nodeId: string expected";
            if (message.timestampUnix != null && $Object.hasOwnProperty.call(message, "timestampUnix"))
                if (!$util.isInteger(message.timestampUnix))
                    return "timestampUnix: integer expected";
            if (message.preset != null && $Object.hasOwnProperty.call(message, "preset"))
                if (typeof message.preset !== "number" || (message.preset | 0) !== message.preset)
                    return "preset: enum value expected";
            if (message.freeText != null && $Object.hasOwnProperty.call(message, "freeText"))
                if (!$util.isString(message.freeText))
                    return "freeText: string expected";
            if (message.signature != null && $Object.hasOwnProperty.call(message, "signature"))
                if (!(message.signature && typeof message.signature.length === "number" || $util.isString(message.signature)))
                    return "signature: buffer expected";
            return null;
        };

        /**
         * Creates a TrailMessage message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof trailguard.TrailMessage
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {trailguard.TrailMessage} TrailMessage
         */
        TrailMessage.fromObject = function (object, _depth) {
            if (object instanceof $root.trailguard.TrailMessage)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".trailguard.TrailMessage: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.trailguard.TrailMessage();
            if (object.hikerId != null)
                if (typeof object.hikerId !== "string" || object.hikerId.length)
                    message.hikerId = $String(object.hikerId);
            if (object.nodeId != null)
                if (typeof object.nodeId !== "string" || object.nodeId.length)
                    message.nodeId = $String(object.nodeId);
            if (object.timestampUnix != null)
                if ($Number(object.timestampUnix) !== 0)
                    message.timestampUnix = object.timestampUnix >>> 0;
            if (object.preset !== 0 && (typeof object.preset !== "string" || $root.trailguard.PresetCode[object.preset] !== 0))
                switch (object.preset) {
                case "PRESET_UNSPECIFIED":
                case 0:
                    message.preset = 0;
                    break;
                case "ALL_OK_DELAYED":
                case 1:
                    message.preset = 1;
                    break;
                case "MINOR_INJURY_MOBILE":
                case 2:
                    message.preset = 2;
                    break;
                case "LOW_ON_WATER_SUPPLIES":
                case 3:
                    message.preset = 3;
                    break;
                case "WEATHER_TURNING_BACK":
                case 4:
                    message.preset = 4;
                    break;
                case "NEED_NONURGENT_ASSIST":
                case 5:
                    message.preset = 5;
                    break;
                case "CUSTOM_TEXT":
                case 15:
                    message.preset = 15;
                    break;
                default:
                    if (typeof object.preset === "number" && (object.preset | 0) === object.preset)
                        message.preset = object.preset;
                }
            if (object.freeText != null)
                if (typeof object.freeText !== "string" || object.freeText.length)
                    message.freeText = $String(object.freeText);
            if (object.signature != null)
                if (object.signature.length)
                    if (typeof object.signature === "string")
                        $util.base64.decode(object.signature, message.signature = $util.newBuffer($util.base64.length(object.signature)), 0);
                    else if (object.signature.length >= 0)
                        message.signature = object.signature;
            return message;
        };

        /**
         * Creates a plain object from a TrailMessage message. Also converts values to other types if specified.
         * @function toObject
         * @memberof trailguard.TrailMessage
         * @static
         * @param {trailguard.TrailMessage} message TrailMessage
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        TrailMessage.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                object.hikerId = "";
                object.nodeId = "";
                object.timestampUnix = 0;
                object.preset = options.enums === $String ? "PRESET_UNSPECIFIED" : 0;
                object.freeText = "";
                if (options.bytes === $String)
                    object.signature = "";
                else {
                    object.signature = [];
                    if (options.bytes !== $Array)
                        object.signature = $util.newBuffer(object.signature);
                }
            }
            if (message.hikerId != null && $Object.hasOwnProperty.call(message, "hikerId"))
                object.hikerId = message.hikerId;
            if (message.nodeId != null && $Object.hasOwnProperty.call(message, "nodeId"))
                object.nodeId = message.nodeId;
            if (message.timestampUnix != null && $Object.hasOwnProperty.call(message, "timestampUnix"))
                object.timestampUnix = message.timestampUnix;
            if (message.preset != null && $Object.hasOwnProperty.call(message, "preset"))
                object.preset = options.enums === $String ? $root.trailguard.PresetCode[message.preset] === $undefined ? message.preset : $root.trailguard.PresetCode[message.preset] : message.preset;
            if (message.freeText != null && $Object.hasOwnProperty.call(message, "freeText"))
                object.freeText = message.freeText;
            if (message.signature != null && $Object.hasOwnProperty.call(message, "signature"))
                object.signature = options.bytes === $String ? $util.base64.encode(message.signature, 0, message.signature.length) : options.bytes === $Array ? $Array.prototype.slice.call(message.signature) : message.signature;
            return object;
        };

        /**
         * Converts this TrailMessage to JSON.
         * @function toJSON
         * @memberof trailguard.TrailMessage
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        TrailMessage.prototype.toJSON = function() {
            return TrailMessage.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for TrailMessage
         * @function getTypeUrl
         * @memberof trailguard.TrailMessage
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        TrailMessage.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/trailguard.TrailMessage";
        };

        return TrailMessage;
    })();

    trailguard.Ack = (function() {

        /**
         * Properties of an Ack.
         * @typedef {Object} trailguard.Ack.$Properties
         * @property {string|null} [originalMessageId] Ack originalMessageId
         * @property {number|null} [ackTimestampUnix] Ack ackTimestampUnix
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of an Ack.
         * @memberof trailguard
         * @interface IAck
         * @augments trailguard.Ack.$Properties
         * @deprecated Use trailguard.Ack.$Properties instead.
         */

        /**
         * Shape of an Ack.
         * @typedef {trailguard.Ack.$Properties} trailguard.Ack.$Shape
         */

        /**
         * Constructs a new Ack.
         * @memberof trailguard
         * @classdesc Represents an Ack.
         * @constructor
         * @param {trailguard.Ack.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var Ack = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * Ack originalMessageId.
         * @member {string} originalMessageId
         * @memberof trailguard.Ack
         * @instance
         */
        Ack.prototype.originalMessageId = "";

        /**
         * Ack ackTimestampUnix.
         * @member {number} ackTimestampUnix
         * @memberof trailguard.Ack
         * @instance
         */
        Ack.prototype.ackTimestampUnix = 0;

        /**
         * Creates a new Ack instance using the specified properties.
         * @function create
         * @memberof trailguard.Ack
         * @static
         * @param {trailguard.Ack.$Properties=} [properties] Properties to set
         * @returns {trailguard.Ack} Ack instance
         * @type {{
         *   (properties: trailguard.Ack.$Shape): trailguard.Ack & trailguard.Ack.$Shape;
         *   (properties?: trailguard.Ack.$Properties): trailguard.Ack;
         * }}
         */
        Ack.create = function(properties) {
            return new Ack(properties);
        };

        /**
         * Encodes the specified Ack message. Does not implicitly {@link trailguard.Ack.verify|verify} messages.
         * @function encode
         * @memberof trailguard.Ack
         * @static
         * @param {trailguard.Ack.$Properties} message Ack message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Ack.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.originalMessageId != null && $Object.hasOwnProperty.call(message, "originalMessageId") && message.originalMessageId !== "")
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.originalMessageId);
            if (message.ackTimestampUnix != null && $Object.hasOwnProperty.call(message, "ackTimestampUnix") && message.ackTimestampUnix !== 0)
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.ackTimestampUnix);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified Ack message, length delimited. Does not implicitly {@link trailguard.Ack.verify|verify} messages.
         * @function encodeDelimited
         * @memberof trailguard.Ack
         * @static
         * @param {trailguard.Ack.$Properties} message Ack message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Ack.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes an Ack message from the specified reader or buffer.
         * @function decode
         * @memberof trailguard.Ack
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {trailguard.Ack & trailguard.Ack.$Shape} Ack
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Ack.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end, message, value;
            if (length === $undefined)
                end = reader.len;
            else {
                end = reader.pos + length;
                if (end > reader.len)
                    throw $RangeError("index out of range");
                length = reader.len;
                reader.len = end;
            }
            message = _target || new $root.trailguard.Ack();
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.originalMessageId = value;
                        else
                            delete message.originalMessageId;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.uint32())
                            message.ackTimestampUnix = value;
                        else
                            delete message.ackTimestampUnix;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (length !== $undefined) {
                if (reader.pos !== end)
                    throw $RangeError("index out of range");
                reader.len = length;
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes an Ack message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof trailguard.Ack
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {trailguard.Ack & trailguard.Ack.$Shape} Ack
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Ack.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an Ack message.
         * @function verify
         * @memberof trailguard.Ack
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Ack.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.originalMessageId != null && $Object.hasOwnProperty.call(message, "originalMessageId"))
                if (!$util.isString(message.originalMessageId))
                    return "originalMessageId: string expected";
            if (message.ackTimestampUnix != null && $Object.hasOwnProperty.call(message, "ackTimestampUnix"))
                if (!$util.isInteger(message.ackTimestampUnix))
                    return "ackTimestampUnix: integer expected";
            return null;
        };

        /**
         * Creates an Ack message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof trailguard.Ack
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {trailguard.Ack} Ack
         */
        Ack.fromObject = function (object, _depth) {
            if (object instanceof $root.trailguard.Ack)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".trailguard.Ack: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.trailguard.Ack();
            if (object.originalMessageId != null)
                if (typeof object.originalMessageId !== "string" || object.originalMessageId.length)
                    message.originalMessageId = $String(object.originalMessageId);
            if (object.ackTimestampUnix != null)
                if ($Number(object.ackTimestampUnix) !== 0)
                    message.ackTimestampUnix = object.ackTimestampUnix >>> 0;
            return message;
        };

        /**
         * Creates a plain object from an Ack message. Also converts values to other types if specified.
         * @function toObject
         * @memberof trailguard.Ack
         * @static
         * @param {trailguard.Ack} message Ack
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Ack.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                object.originalMessageId = "";
                object.ackTimestampUnix = 0;
            }
            if (message.originalMessageId != null && $Object.hasOwnProperty.call(message, "originalMessageId"))
                object.originalMessageId = message.originalMessageId;
            if (message.ackTimestampUnix != null && $Object.hasOwnProperty.call(message, "ackTimestampUnix"))
                object.ackTimestampUnix = message.ackTimestampUnix;
            return object;
        };

        /**
         * Converts this Ack to JSON.
         * @function toJSON
         * @memberof trailguard.Ack
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Ack.prototype.toJSON = function() {
            return Ack.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for Ack
         * @function getTypeUrl
         * @memberof trailguard.Ack
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        Ack.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/trailguard.Ack";
        };

        return Ack;
    })();

    return trailguard;
})();

module.exports = $root;
