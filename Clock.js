var Clock = (function() {
    var QUARTER_CIRCLE = Math.PI / 2;
    var FULL_CIRCLE = Math.PI * 2;

    var LEGACY_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var NEW_DAYS = ["Nullday", "Unday", "Duoday", "Triday", "Quadday", "Pentday", "Hexday", "Heptday", "Octday", "Nonday"];

    var OUTER_CIRCLE = 0.4015;

    function isDST(today) {
        // thanks to http://www.mresoftware.com/simpleDST.htm
        today = today || new Date();
        var year = today.getFullYear();
        var january = new Date(year, 0);	// January 1 local
        var july = new Date(year, 6);	// July 1 local
        // northern hemisphere test
        if (january.getTimezoneOffset() > july.getTimezoneOffset() && today.getTimezoneOffset() != january.getTimezoneOffset()){
            return true;
        }
        // southern hemisphere test
        if (january.getTimezoneOffset() < july.getTimezoneOffset() && today.getTimezoneOffset() != july.getTimezoneOffset()){
            return true;
        }
        return false;
    }

    function dayOfUTCYear(date) {
        date = date || new Date();
        var yearStart = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0);
        var millis = date.getTime() - yearStart;
        return Math.floor(millis / (1000 * 60 * 60 * 24));
    }

    function formatFraction(timeFraction) {
        var mss = pad(Math.floor(timeFraction * (10 * 100 * 100 * 1000)), 8);
        mss = mss.substring(mss.length - 8);
        mss = "." + mss.substring(0, 1) + ":" + mss.substring(1, 3) + ":" + mss.substring(3, 5) + ":" + mss.substring(5);
        return mss;
    }

    function pad(str, desiredLength, paddingChar, after) {
        after = Boolean(after);
        if (paddingChar == null) paddingChar = "0"; else paddingChar = paddingChar.toString();
        desiredLength = desiredLength || 2;
        str = str.toString();
        var missingChars = desiredLength - str.length;
        var padding = "";
        for (var i = 0; i < missingChars; ++i) {
            padding += paddingChar;
        }
        return (after ? str : "") + padding + (after ? "" : str);
    };

    function spokeLine(g, inner, outer, angle) {
        g.beginPath();
        g.moveTo(inner * Math.cos(angle), inner * Math.sin(angle));
        g.lineTo(outer * Math.cos(angle), outer * Math.sin(angle));
        g.closePath();
        return g;
    }

    function circle(radius) {
        g.beginPath();
        g.arc(0, 0, radius, 0, Math.PI * 2, true);
        g.closePath();
        return g;
    }

    function sector(g, inner, outer, startAngle, endAngle) {
        g.beginPath();
        g.moveTo(inner * Math.cos(startAngle), inner * Math.sin(startAngle));
        g.lineTo(outer * Math.cos(startAngle), outer * Math.sin(startAngle));
        g.arc(0, 0, outer, startAngle, endAngle, false);
        g.lineTo(inner * Math.cos(endAngle), inner * Math.sin(endAngle));
        g.arc(0, 0, inner, endAngle, startAngle, true);
        g.closePath();
        return g;
    }


    function drawTextAlongArc(g, str, centerX, centerY, radius, startAngle){
        g.save();
        var measure = g.measureText(str);
        var width = measure.width;
        var circumference = 2 * Math.PI * radius;
        var angleSwept = (width / circumference) * 2 * Math.PI;
        var angleIncrement = angleSwept / str.length;
        if (g.textAlign == "right") {
            startAngle -= angleSwept;
        }
        g.translate(centerX, centerY);
        g.rotate(startAngle + QUARTER_CIRCLE - angleIncrement / 2);
        g.strokeStyle = "white";
        g.lineWidth = g.lineWidth * 1.9;
        for (var n = 0; n < str.length; n++) {
            g.rotate(angleIncrement);
            g.save();
            g.translate(0, - radius);
            var char = str[n];
            g.strokeText(char, 0, 0);
            g.fillText(char, 0, 0);
            g.restore();
        }
        g.restore();
    }

    function drawSpokes(g, radius, innerRadius, startAngle, number) {
        for (var theta = 0; theta < Math.PI * 2; theta += (Math.PI * 2 / number)) {
            spokeLine(g, innerRadius, radius, theta + startAngle).stroke();
        }
    }

    function drawLabels(g, radius, startAngle, labels, scale) {
        for (var i = 0; i < labels.length; ++i) {
            var theta = startAngle + i * (Math.PI * 2 / labels.length);
            var y = radius * Math.sin(theta);
            g.fillText(labels[i], radius * Math.cos(theta), y);
            g.strokeText(labels[i], radius * Math.cos(theta), y);
        }
    }

    function Clock() {
        var now = new Date();
        // this is the time of local midnight (non DST) as a fraction of a UTC day.
        this.offsetProportion = (now.getTimezoneOffset() + (isDST(now) ? 60 : 0))/ (24 * 60);
        this.rise = 0.25 + this.offsetProportion;
        this.set = 0.75 + this.offsetProportion;
        this.selection = {show: false, x: NaN, y: NaN};
        this.events = [];
    }

    Clock.Event = function(name, startTime, endTime, image) {
        this.name = name;
        this.startTime = startTime;
        this.endTime = endTime;
        this.image = image;
    };

    Clock.prototype = {
        drawFace: function drawFace(g, scale) {
            var zeroAngle = this.offsetProportion * FULL_CIRCLE + QUARTER_CIRCLE;
            g.strokeStyle = "rgb(200, 200, 200)";
            g.lineWidth = 0.05 * scale / 100;
            drawSpokes(g, OUTER_CIRCLE * scale, 0.25 * scale, zeroAngle, 100);
            g.lineWidth = 0.1 * scale / 100;
            circle(0.38 * scale).stroke();
            drawSpokes(g, OUTER_CIRCLE * scale, 0.10 * scale,  zeroAngle, 20);
            g.lineWidth = 0.25 * scale / 100;
            circle(0.05 * scale).stroke();
            circle(OUTER_CIRCLE * scale).stroke();
            drawSpokes(g, OUTER_CIRCLE * scale, 0.05 * scale, zeroAngle, 10);

            spokeLine(g, 0, 0.05 * scale, QUARTER_CIRCLE).stroke();
            spokeLine(g, 0, 0.05 * scale, 3 * QUARTER_CIRCLE).stroke();

            g.font = (7.5 * scale / 100) + "px serif";
            g.textBaseline = "middle";
            g.textAlign = "center";
            g.fillStyle = "rgb(150, 150, 150)";
            g.strokeStyle = "rgb(255, 255, 255)";
            g.lineWidth = 2 * scale / 100;
            // label(g, 90, offset, ["O", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"]);
            drawLabels(g, 0.35 * scale, zeroAngle, ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], scale);
            g.strokeStyle = "rgb(100, 100, 100)";
            g.lineWidth = 0.25 * scale / 100;
            drawLabels(g, 0.35 * scale, zeroAngle, ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], scale);
        },

        drawHands: function drawHands(g, scale, date) {
            var zeroAngle = this.offsetProportion * FULL_CIRCLE + QUARTER_CIRCLE;
            date = date || new Date();
            var localTime = Time.fromDate(date);
            var time = localTime.changeTimeZone(date.getTimezoneOffset() / -60, 0);
            var timeFraction = time.valueOf();
            var angle;

            var secSection = timeFraction * 1000 - Math.floor(timeFraction * 1000);
            secSection = Math.floor(secSection * 100) / 100;
            angle = (secSection * FULL_CIRCLE) + zeroAngle;
            g.strokeStyle = "rgb(230, 90, 90)";
            g.lineWidth = 0.5 * scale / 100;
            spokeLine(g, 0, OUTER_CIRCLE * scale, angle).stroke();
            g.lineWidth = 1.5 * scale / 100;
            spokeLine(g, 0.325 * scale, OUTER_CIRCLE * scale, angle).stroke();

            var minSection = timeFraction * 10 - Math.floor(timeFraction * 10);
            minSection = Math.floor(minSection * 100) / 100;
            angle = (minSection * FULL_CIRCLE) + zeroAngle;
            g.strokeStyle = "rgb(90, 230, 90)";
            g.lineWidth = 1.5 * scale / 100;
            spokeLine(g, 0.275 * scale, 0.325 * scale, angle).stroke();
            g.lineWidth = 0.5 * scale / 100;
            spokeLine(g, 0, 0.325 * scale, angle).stroke();

            g.strokeStyle = "rgb(90, 90, 230)";
            g.lineWidth = 1.5 * scale / 100;
            angle = (timeFraction * FULL_CIRCLE) + zeroAngle;
            spokeLine(g, 0, 0.275 * scale, angle).stroke();

            g.font = (3 * scale / 100) + "px monospace";
            g.textAlign = "left";
            g.fillStyle= "black";
            g.fillText(formatFraction(timeFraction), -0.475 * scale, -0.48 * scale);
            g.fillText(localTime.toString(), 0.25 * scale, -0.48 * scale);
        },

        drawNightPeriod:function(g, scale) {
            var zeroAngle = this.offsetProportion * FULL_CIRCLE + QUARTER_CIRCLE;
            g.fillStyle = "rgba(50, 50, 50, 0.1)";
            g.beginPath();
            g.moveTo(0, 0);
            g.arc(0, 0, 0.38 * scale, this.rise * FULL_CIRCLE + zeroAngle, this.set * FULL_CIRCLE + zeroAngle, true);
            g.moveTo(0, 0);
            g.closePath();
            g.fill();
        },

        drawDays:function (g, scale, zeroAngle, localTime) {
            g.font = (3 * scale / 100) + "px monospace";
            var yearDay = dayOfUTCYear(localTime);
            var today = NEW_DAYS[yearDay % 10];
            g.textAlign = "right";
            g.fillStyle = "black";
            drawTextAlongArc(g, today.toUpperCase(), 0, 0, 0.46 * scale, zeroAngle);
            spokeLine(g, 0.44 * scale, 0.48 * scale, zeroAngle).stroke();

            var legacyWeekDay = localTime.getDay();
            var legacyToday = LEGACY_DAYS[legacyWeekDay % 7];
            var tzProportion = (localTime.getTimezoneOffset()) / (24 * 60);

            g.textAlign = "right";
            drawTextAlongArc(g, legacyToday.toUpperCase(), 0, 0, 0.42 * scale, zeroAngle + tzProportion * FULL_CIRCLE);
            spokeLine(g, OUTER_CIRCLE * scale, 0.44 * scale, zeroAngle + tzProportion * FULL_CIRCLE).stroke();

            g.font = (3 * scale / 100) + "px monospace";

            g.textAlign = "left";
            g.fillStyle = "black";
            var mon = Math.floor(yearDay / 10);
            if (mon % 10 == 1) {
                mon = mon + "st ";
            } else if (mon % 10 == 2) {
                mon = mon + "nd ";
            } else if (mon % 10 == 3) {
                mon = mon + "rd ";
            } else {
                mon = mon + "th ";
            }
            g.fillText(mon + today, -0.475 * scale, -0.45 * scale);
            g.fillText(legacyToday, 0.25 * scale, -0.45 * scale);
            return localTime;
        },
        drawInnerCircle:function (scale, g) {
            circle(0.01 * scale).stroke();
            g.fillStyle = "rgb(90, 90, 230)";
            g.fill();
        },
        drawSelection:function (g, x, y, scale) {
            var angle = -Math.atan2(this.selection.x - (x + scale / 2), this.selection.y - (y + scale / 2)) + Math.PI / 2;
            g.strokeStyle = "rgba(0, 0, 0, 0.2)";
            g.lineWidth = 2;
            spokeLine(g, 0, scale * 2, angle).stroke();
            var time = this.screenAngleToTime(angle);
            var nuTime = formatFraction(time.valueOf());
            var oldTime = time.changeTimeZone(0, localTimeZone).toString();
            g.font = (0.02 * scale) + "px monospace";
            drawTextAlongArc(g, nuTime, 0, 0, 0.3885 * scale, angle);
            g.textAlign = "right";
            g.fillStyle = "rgba(0, 0, 0, 0.7)";
            drawTextAlongArc(g, oldTime, 0, 0, 0.3885 * scale, angle);
        },
        drawEvents:function (g, scale) {
            for (var i = 0; i < this.events.length; ++i) {
                var distanceOut, x, y;
                var event = this.events[i];
                if (event.image != null) {
                    var angle = this.timeToScreenAngle(event.startTime);
                    distanceOut = 0.4 * scale;
                    x = distanceOut * Math.cos(angle) - event.image.width / 2;
                    y = distanceOut * Math.sin(angle) - event.image.height / 2;
                    g.drawImage(event.image, x, y);
                }
                if (event.startTime && event.endTime) {
                    var startAngle = this.timeToScreenAngle(event.startTime);
                    var endAngle = this.timeToScreenAngle(event.endTime);
                    g.fillStyle = ["rgba(230, 180, 180, 0.7)", "rgba(180, 230, 180, 0.7)", "rgba(180, 180, 230, 0.7)"][ i % 3];
                    var minOut = 0.25;
                    sector(g, (minOut + (i * 0.015)) * scale, (minOut + 0.04 + i * 0.015) * scale, startAngle, endAngle).fill();
                    var angle = (endAngle - startAngle) / 2 + startAngle;
                    distanceOut = (minOut + 0.01 + (i * 0.015)) * scale;
                    x = distanceOut * Math.cos(angle);
                    y = distanceOut * Math.sin(angle);
                }
                if (event.name) {
                    g.font = (2.15 * scale / 100) + "px sans-serif";
                    g.textAlign = "left";
                    g.fillStyle = "black";
                    var width = g.measureText(event.name).width;
                    g.fillText(event.name, x - width / 2, y);
                }
            }
        },
        render: function render(g, x, y, scale) {
            var localTime = new Date();
            var zeroAngle = this.offsetProportion * FULL_CIRCLE + QUARTER_CIRCLE;
            g.save();
            g.translate(x + scale / 2, y + scale / 2);
            this.drawFace(g, scale);
            this.drawNightPeriod(g, scale);
            this.drawEvents(g, scale);
            this.drawDays(g, scale, zeroAngle, localTime);
            this.drawInnerCircle(scale, g);
            if (this.selection.show) {
                this.drawSelection(g, x, y, scale);
            }
            this.drawHands(g, scale, localTime);
            g.restore();
        },
        addEvent: function addEvent(name, start, end, image) {
            this.events.push(new Clock.Event(name, start, end, image));
        },
        clearEvents: function() {
            this.events = [];
        },
        setLocation: function setPosition(lat, long) {
            var sp = new SolarPosition(
                JulianDay.fromDate(),
                lat, long
            );
            var result = sp.getSunRiseTransitSet();
            this.rise = result.sunRiseUTC.valueOf();
            this.set = result.sunSetUTC.valueOf();
            // this is the time of local solar midnight as a fraction of a UTC day.
            this.offsetProportion = - (result.sunTransitUTC.valueOf() - 0.5);
        },
        screenAngleToTime: function screenAngleToTime(angle) {
            var dayFraction = (angle - QUARTER_CIRCLE) / FULL_CIRCLE;
            if (dayFraction < 0) dayFraction += 1;
            return new Time(dayFraction - this.offsetProportion);
        },
        timeToScreenAngle: function timeToScreenAngle(time) {
           return (time.valueOf() + this.offsetProportion) * FULL_CIRCLE + QUARTER_CIRCLE;
        },
        showSelection: function(showSelection) {
            if (showSelection === undefined) showSelection = true;
            this.selection.show = showSelection;
        },
        setSelection: function(x, y) {
            this.selection.x = x;
            this.selection.y = y;
        },
        utils: {
            dayOfYear:dayOfUTCYear, drawTextAlongArc:drawTextAlongArc, drawSpokeLine:spokeLine, pad:pad,
            label:drawLabels, circle:circle,   isDST:isDST, formatFraction: formatFraction, sector:sector
        }
    };

    return Clock;
})();