var Clock = (function() {
    var QUARTER_CIRCLE = Math.PI / 2;
    var FULL_CIRCLE = Math.PI * 2;

    var LEGACY_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var NEW_DAYS = ["Nullday", "Unday", "Duoday", "Triday", "Quadday", "Pentday", "Hexday", "Heptday", "Octday", "Nonday"];

    function dayOfYear(date) {
        date = date || new Date();
        var yearStart = Date.UTC(date.getFullYear(), 0, 1, 0, 0, 0);
        var millis = date.getTime() - yearStart;
        return Math.floor(millis / (1000 * 60 * 60 * 24));
    }

    function drawTextAlongArc(context, str, centerX, centerY, radius, startAngle){
        context.save();
        var measure = context.measureText(str);
        var width = measure.width;
        var circumference = 2 * Math.PI * radius;
        var angleSwept = (width / circumference) * 2 * Math.PI;
        var angleIncrement = angleSwept / str.length;
        if (context.textAlign == "right") {
            startAngle -= angleSwept;
        }
        context.translate(centerX, centerY);
        context.rotate(startAngle + QUARTER_CIRCLE - angleIncrement / 2);
        for (var n = 0; n < str.length; n++) {
            context.rotate(angleIncrement);
            context.save();
            context.translate(0, - radius);
            var char = str[n];
            context.fillText(char, 0, 0);
            context.restore();
        }
        context.restore();
    }

    function drawSpokeLine(g, inner, outer, angle) {
        g.beginPath();
        g.moveTo(inner * Math.cos(angle), inner * Math.sin(angle));
        g.lineTo(outer * Math.cos(angle), outer * Math.sin(angle));
        g.closePath();
        g.stroke();
    }

    function spokes(g, radius, innerRadius, startAngle, number) {
        for (var theta = 0; theta < Math.PI * 2; theta += (Math.PI * 2 / number)) {
            drawSpokeLine(g, innerRadius, radius, theta + startAngle);
        }
    }

    function label(g, radius, startAngle, labels) {
        for (var i = 0; i < labels.length; ++i) {
            var theta = startAngle + i * (Math.PI * 2 / labels.length);
            var y = radius * Math.sin(theta) + 8;
            if (y > 0) y -= 2;
            g.fillText(labels[i], radius * Math.cos(theta), y);
            g.strokeText(labels[i], radius * Math.cos(theta), y);
        }
    }

    function circle(radius) {
        g.beginPath();
        g.arc(0, 0, radius, 0, Math.PI * 2, true);
        g.closePath();
        g.stroke();
    }

    function isDST(today) {
        // thanks to http://www.mresoftware.com/simpleDST.htm
        today = today || new Date();
        var year = today.getFullYear();
        var january = new Date(year, 0);	// January 1
        var july = new Date(year, 6);	// July 1
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

    function Clock() {
        var now = new Date();
        // this is the time of local midnight (non DST) as a fraction of a UTC day.
        this.offsetProportion = (now.getTimezoneOffset() + (isDST(now) ? 60 : 0))/ (24 * 60);
        this.rise = 0.25 + this.offsetProportion;
        this.set = 0.75 + this.offsetProportion;
    }

    Clock.prototype = {
        drawFace: function drawFace(g, scale) {
            var zeroAngle = this.offsetProportion * FULL_CIRCLE + QUARTER_CIRCLE;
            g.strokeStyle = "rgb(200, 200, 200)";
            g.lineWidth = 0.1 * scale / 100;
            spokes(g, 0.80 * scale, 0.50 * scale, zeroAngle, 100);
            g.lineWidth = 0.2 * scale / 100;
            circle(0.76 * scale);
            spokes(g, 0.80 * scale, 0.20 * scale,  zeroAngle, 20);
            g.lineWidth = 0.5 * scale / 100;
            circle(0.10 * scale);
            circle(0.80 * scale);
            spokes(g, 0.80 * scale, 0.10 * scale, zeroAngle, 10);

            drawSpokeLine(g, 0, 0.1 * scale, QUARTER_CIRCLE);
            drawSpokeLine(g, 0, 0.1 * scale, 3 * QUARTER_CIRCLE);

            g.font = (15*scale / 100) + "px serif";
            g.textAlign = "center";
            g.fillStyle = "rgb(150, 150, 150)";
            g.strokeStyle = "rgb(255, 255, 255)";
            g.lineWidth = 4 * scale / 100;
            // label(g, 90, offset, ["O", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"]);
            label(g, 0.70 * scale, zeroAngle, ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
            g.strokeStyle = "rgb(100, 100, 100)";
            g.lineWidth = 0.5 * scale / 100;
            label(g, 0.70 * scale, zeroAngle, ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
        },

        drawHands: function drawHands(g, scale) {
            var zeroAngle = this.offsetProportion * FULL_CIRCLE + QUARTER_CIRCLE;
            var date = new Date();
            var localTime = Time.fromDate(date);
            var time = localTime.changeTimeZone(date.getTimezoneOffset() / -60, 0);
            var timeFraction = time.valueOf();
            var angle;

            var secSection = timeFraction * 1000 - Math.floor(timeFraction * 1000);
            secSection = Math.floor(secSection * 100) / 100;
            angle = (secSection * FULL_CIRCLE) + zeroAngle;
            g.strokeStyle = "rgb(230, 90, 90)";
            g.lineWidth = 1 * scale / 100;
            drawSpokeLine(g, 0, 0.80 * scale, angle);
            g.lineWidth = 3 * scale / 100;
            drawSpokeLine(g, 0.65 * scale, 0.80 * scale, angle);

            var minSection = timeFraction * 10 - Math.floor(timeFraction * 10);
            minSection = Math.floor(minSection * 100) / 100;
            angle = (minSection * FULL_CIRCLE) + zeroAngle;
            g.strokeStyle = "rgb(90, 230, 90)";
            g.lineWidth = 3 * scale / 100;
            drawSpokeLine(g, 0.55 * scale, 0.65 * scale, angle);
            g.lineWidth = 1 * scale / 100;
            drawSpokeLine(g, 0, 0.65 * scale, angle);

            g.strokeStyle = "rgb(90, 90, 230)";
            g.lineWidth = 3 * scale / 100;
            angle = (timeFraction * FULL_CIRCLE) + zeroAngle;
            drawSpokeLine(g, 0, 0.55 * scale, angle);

            g.font = (6 * scale / 100) + "px monospace";
            g.textAlign = "left";
            g.fillStyle= "black";

            var mss = "00000000" + Math.floor(timeFraction * (10 * 100 * 100 * 1000));
            mss = mss.substring(mss.length - 8);
            mss = "." + mss.substring(0, 1) + ":" + mss.substring(1, 3) + ":" + mss.substring(3, 5) + ":" + mss.substring(5);
            g.fillText(mss, -0.95 * scale, 0.98 * scale);
            g.fillText(localTime.toString(), 0.50 * scale, 0.98 * scale);
        },

        drawNightPeriod:function(g, scale) {
            var zeroAngle = this.offsetProportion * FULL_CIRCLE + QUARTER_CIRCLE;
            g.fillStyle = "rgba(50, 50, 50, 0.1)";
            g.beginPath();
            g.moveTo(0, 0);
            g.arc(0, 0, 0.76 * scale, this.rise * FULL_CIRCLE + zeroAngle, this.set * FULL_CIRCLE + zeroAngle, true);
            g.moveTo(0, 0);
            g.closePath();
            g.fill();
        },

        render: function render(g, centerX, centerY, scale) {
            g.save();
            g.translate(centerX, centerY);
            var zeroAngle = this.offsetProportion * FULL_CIRCLE + QUARTER_CIRCLE;
            this.drawFace(g, scale);
            this.drawNightPeriod(g, scale);

            g.font = (6 * scale / 100) + "px monospace";

            var now = new Date();
            var yearDay = dayOfYear(now);
            var today  = NEW_DAYS[yearDay % 10];
            g.textAlign = "right";
            g.fillStyle = "black";
            drawTextAlongArc(g, today.toUpperCase(), 0, 0, 0.9 * scale, zeroAngle);
            drawSpokeLine(g, 0.88 * scale, 0.96 * scale, zeroAngle);

            var legacyWeekDay = new Date().getDay();
            var legacyToday = LEGACY_DAYS[legacyWeekDay % 7];
            var tzProportion = (now.getTimezoneOffset())/ (24 * 60);

            g.textAlign = "right";
            drawTextAlongArc(g, legacyToday.toUpperCase(), 0, 0, 0.82 * scale, zeroAngle + tzProportion * FULL_CIRCLE );
            drawSpokeLine(g, 0.80 * scale, 0.88 * scale, zeroAngle + tzProportion * FULL_CIRCLE);

            g.font = (6 * scale / 100) + "px monospace";

            g.textAlign = "left";
            g.fillStyle= "black";
            var mon =  Math.floor(yearDay / 10);
            if (mon % 10 == 1) {
                mon = mon + "st ";
            } else if (mon % 10 == 2) {
                mon = mon + "nd ";
            } else if (mon % 10 == 3) {
                mon = mon + "rd ";
            } else {
                mon = mon + "th ";
            }
            g.fillText( mon+today, -0.95 * scale, 0.92 * scale);
            g.fillText(legacyToday, 0.50 * scale, 0.92 * scale);

            this.drawHands(g, scale);
            g.restore();
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
        utils: {
            dayOfYear:dayOfYear,   drawTextAlongArc:drawTextAlongArc,      drawSpokeLine:drawSpokeLine,
            label:label, circle:circle,   isDST:isDST
        }
    };

    return Clock;
})();