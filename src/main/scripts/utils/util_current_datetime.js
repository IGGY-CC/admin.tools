getDate = function(year="2-digit", month="short", day="numeric", hour="2-digit", minute="2-digit", second="2-digit", weekday="short") {
    let date = new Date();
    let options = {};

    if(year) options.year = year;
    if(month) options.month = month;
    if(day) options.day = day;
    if(hour) options.hour = hour;
    if(minute) options.minute = minute;
    if(second) options.second = second;
    if(weekday) options.weekday = weekday;

    return date.toLocaleTimeString(undefined, options);
};