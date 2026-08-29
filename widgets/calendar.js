import { createWidget, is24Hour } from "../widgetCore.js";


const MODE_KEY = "calendarMode";
const CACHE_KEY = "calendarEventsCache";
const REFRESH_INTERVAL = 30 * 1000;


// # Calendar Integration V2


// ## V2 Release Notes:

// Fixed some bugs:

// -   Incorrect Time rendering
// -   Repeating Events not rendering

// Added some features:

// -   Data Caching for quicker load times
// -   Auto-refresh every 30 seconds if the page is focused





function parseDate(value, timezone = null) {

  if (!value)
    return null;


  /*
   * The first 8 characters of an ICS date/time
   * are always the calendar date:
   *
   * YYYYMMDD
   */
  const year =
    Number(value.slice(0, 4));

  const month =
    Number(value.slice(4, 6)) - 1;

  const day =
    Number(value.slice(6, 8));


  /*
   * Keep the original calendar date separately.
   *
   * This is important because JavaScript Date
   * objects can move across calendar days when
   * timezones are involved.
   */
  const calendarDate =
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


  /*
   * All-day event: YYYYMMDD
   */
  if (!value.includes("T")) {

    const date =
      new Date(
        year,
        month,
        day
      );

    date.calendarDate =
      calendarDate;

    return date;

  }


  const hour =
    Number(value.slice(9, 11));

  const minute =
    Number(value.slice(11, 13));

  const second =
    Number(value.slice(13, 15) || 0);


  let date;


  /*
   * Explicit UTC.
   */
  if (value.endsWith("Z")) {

    date =
      new Date(
        Date.UTC(
          year,
          month,
          day,
          hour,
          minute,
          second
        )
      );

  } else {

    /*
     * No timezone specified:
     * treat the event as local calendar time.
     */
    date =
      new Date(
        year,
        month,
        day,
        hour,
        minute,
        second
      );

  }


  /*
   * Preserve the original ICS calendar date.
   */
  date.calendarDate =
    calendarDate;


  return date;

}





function expandRecurringEvent(event) {

  if (!event.rrule || !event.start)
    return [event];


  /*
   * ----------------------------------------
   * Parse RRULE
   * ----------------------------------------
   */

  const rule = {};

  event.rrule
    .split(";")
    .forEach(part => {

      const separator =
        part.indexOf("=");

      if (separator === -1)
        return;

      const key =
        part.slice(0, separator)
          .toUpperCase();

      const value =
        part.slice(separator + 1);

      rule[key] = value;

    });


  const frequency =
    rule.FREQ?.toUpperCase();


  if (!frequency)
    return [event];


  const interval =
    Math.max(
      1,
      Number(rule.INTERVAL || 1)
    );


  const countLimit =
    rule.COUNT
      ? Math.max(0, Number(rule.COUNT))
      : null;


  /*
   * ----------------------------------------
   * Helpers
   * ----------------------------------------
   */

  const weekdayNumbers = {
    SU: 0,
    MO: 1,
    TU: 2,
    WE: 3,
    TH: 4,
    FR: 5,
    SA: 6
  };


  function dateKey(date) {

    return (
      `${date.getFullYear()}-` +
      `${String(date.getMonth() + 1).padStart(2, "0")}-` +
      `${String(date.getDate()).padStart(2, "0")}`
    );

  }


  function cloneDate(date) {

    const result =
      new Date(date);

    result.calendarDate =
      dateKey(result);

    return result;

  }


  function addDays(date, amount) {

    const result =
      new Date(date);

    result.setDate(
      result.getDate() + amount
    );

    return result;

  }


  function daysInMonth(year, month) {

    return new Date(
      year,
      month + 1,
      0
    ).getDate();

  }


  function setCalendarDateTime(
    date,
    year,
    month,
    day,
    reference
  ) {

    const result =
      new Date(reference);

    result.setFullYear(
      year,
      month,
      day
    );

    result.calendarDate =
      dateKey(result);

    return result;

  }


  /*
   * ----------------------------------------
   * Parse UNTIL
   * ----------------------------------------
   */

  let until = null;

  if (rule.UNTIL) {

    const untilValue =
      rule.UNTIL;

    if (
      /^\d{8}T\d{6}Z$/.test(
        untilValue
      )
    ) {

      until =
        new Date(
          Date.UTC(
            Number(untilValue.slice(0, 4)),
            Number(untilValue.slice(4, 6)) - 1,
            Number(untilValue.slice(6, 8)),
            Number(untilValue.slice(9, 11)),
            Number(untilValue.slice(11, 13)),
            Number(untilValue.slice(13, 15))
          )
        );

    }

    else if (
      /^\d{8}T\d{6}$/.test(
        untilValue
      )
    ) {

      until =
        new Date(
          Number(untilValue.slice(0, 4)),
          Number(untilValue.slice(4, 6)) - 1,
          Number(untilValue.slice(6, 8)),
          Number(untilValue.slice(9, 11)),
          Number(untilValue.slice(11, 13)),
          Number(untilValue.slice(13, 15))
        );

    }

    else if (
      /^\d{8}$/.test(
        untilValue
      )
    ) {

      until =
        new Date(
          Number(untilValue.slice(0, 4)),
          Number(untilValue.slice(4, 6)) - 1,
          Number(untilValue.slice(6, 8)),
          23,
          59,
          59
        );

    }

  }


  /*
   * ----------------------------------------
   * Parse BYDAY
   *
   * Examples:
   *
   * MO
   * TU,TH
   * 1MO
   * -1SU
   * ----------------------------------------
   */

  const byDay =
    rule.BYDAY
      ? rule.BYDAY
        .split(",")
        .map(value => {

          const match =
            value.match(
              /^([+-]?\d+)?(SU|MO|TU|WE|TH|FR|SA)$/i
            );

          if (!match)
            return null;

          return {

            ordinal:
              match[1]
                ? Number(match[1])
                : null,

            day:
              weekdayNumbers[
              match[2].toUpperCase()
              ]

          };

        })
        .filter(Boolean)
      : [];


  /*
   * ----------------------------------------
   * Parse BYMONTH
   * ----------------------------------------
   */

  const byMonth =
    rule.BYMONTH
      ? rule.BYMONTH
        .split(",")
        .map(Number)
        .filter(
          value =>
            value >= 1 &&
            value <= 12
        )
      : [];


  /*
   * ----------------------------------------
   * Parse BYMONTHDAY
   * ----------------------------------------
   */

  const byMonthDay =
    rule.BYMONTHDAY
      ? rule.BYMONTHDAY
        .split(",")
        .map(Number)
        .filter(
          value =>
            value !== 0 &&
            value >= -31 &&
            value <= 31
        )
      : [];


  /*
   * ----------------------------------------
   * Parse BYYEARDAY
   * ----------------------------------------
   */

  const byYearDay =
    rule.BYYEARDAY
      ? rule.BYYEARDAY
        .split(",")
        .map(Number)
        .filter(
          value =>
            value !== 0 &&
            value >= -366 &&
            value <= 366
        )
      : [];


  /*
   * ----------------------------------------
   * EXDATE
   *
   * These are attached to the event by
   * parseICS().
   * ----------------------------------------
   */

  const excludedDates =
    new Set(
      (event.exdates || [])
        .map(date => dateKey(date))
    );


  /*
   * ----------------------------------------
   * Duration
   * ----------------------------------------
   */

  const duration =
    event.end
      ? event.end.getTime() -
      event.start.getTime()
      : 0;


  /*
   * ----------------------------------------
   * Check whether a date matches BYDAY
   * ----------------------------------------
   */

  function matchesByDay(date) {

    if (!byDay.length)
      return true;


    const weekday =
      date.getDay();


    const matching =
      byDay.filter(
        item =>
          item.day === weekday
      );


    if (!matching.length)
      return false;


    /*
     * No ordinal:
     *
     * BYDAY=MO
     */
    if (
      matching.some(
        item =>
          item.ordinal === null
      )
    ) {

      return true;

    }


    /*
     * Ordinal BYDAY:
     *
     * 1MO
     * 2TU
     * -1SU
     */

    for (const item of matching) {

      const day =
        date.getDate();

      if (item.ordinal > 0) {

        const occurrence =
          Math.floor(
            (day - 1) / 7
          ) + 1;

        if (
          occurrence ===
          item.ordinal
        ) {

          return true;

        }

      }


      if (item.ordinal < 0) {

        const lastDay =
          daysInMonth(
            date.getFullYear(),
            date.getMonth()
          );

        const reverseOccurrence =
          Math.floor(
            (lastDay - day) / 7
          ) + 1;

        if (
          reverseOccurrence ===
          Math.abs(item.ordinal)
        ) {

          return true;

        }

      }

    }


    return false;

  }


  /*
   * ----------------------------------------
   * Check whether a candidate matches
   * BYMONTHDAY.
   * ----------------------------------------
   */

  function matchesByMonthDay(date) {

    if (!byMonthDay.length)
      return true;


    const day =
      date.getDate();

    const lastDay =
      daysInMonth(
        date.getFullYear(),
        date.getMonth()
      );


    return byMonthDay.some(value => {

      if (value > 0)
        return day === value;

      return (
        day ===
        lastDay + value + 1
      );

    });

  }


  /*
   * ----------------------------------------
   * Check BYMONTH
   * ----------------------------------------
   */

  function matchesByMonth(date) {

    if (!byMonth.length)
      return true;

    return byMonth.includes(
      date.getMonth() + 1
    );

  }


  /*
   * ----------------------------------------
   * Check BYYEARDAY
   * ----------------------------------------
   */

  function matchesByYearDay(date) {

    if (!byYearDay.length)
      return true;


    const year =
      date.getFullYear();


    const first =
      new Date(
        year,
        0,
        1
      );


    const last =
      new Date(
        year,
        11,
        31
      );


    const total =
      Math.round(
        (
          last.getTime() -
          first.getTime()
        ) /
        86400000
      ) + 1;


    const dayOfYear =
      Math.floor(
        (
          date.getTime() -
          first.getTime()
        ) /
        86400000
      ) + 1;


    return byYearDay.some(value => {

      if (value > 0)
        return dayOfYear === value;

      return (
        dayOfYear ===
        total + value + 1
      );

    });

  }


  /*
   * ----------------------------------------
   * Check all BYxxx filters.
   * ----------------------------------------
   */

  function matchesFilters(date) {

    return (
      matchesByMonth(date) &&
      matchesByMonthDay(date) &&
      matchesByYearDay(date) &&
      matchesByDay(date)
    );

  }


  /*
   * ----------------------------------------
   * Add occurrence
   * ----------------------------------------
   */

  const occurrences = [];


  function addOccurrence(start) {

    if (until && start > until)
      return false;


    const key =
      dateKey(start);


    if (excludedDates.has(key))
      return false;


    const occurrence = {

      ...event,

      start:
        cloneDate(start),

      end:
        duration
          ? (() => {

            const end =
              new Date(
                start.getTime() +
                duration
              );

            end.calendarDate =
              dateKey(end);

            return end;

          })()
          : null

    };


    occurrences.push(
      occurrence
    );


    return true;

  }


  /*
   * ----------------------------------------
   * COUNT=1 means the DTSTART occurrence
   * itself counts as occurrence #1.
   * ----------------------------------------
   */

  let generatedCount = 0;


  /*
   * ----------------------------------------
   * Search window
   *
   * We don't need infinite recurrences.
   *
   * 10 years gives the widget plenty of
   * coverage while still preventing an
   * accidental infinite loop.
   * ----------------------------------------
   */

  const searchEnd =
    new Date(
      event.start
    );

  searchEnd.setFullYear(
    searchEnd.getFullYear() + 10
  );


  /*
   * ----------------------------------------
   * DAILY
   * ----------------------------------------
   */

  if (frequency === "DAILY") {

    let current =
      cloneDate(event.start);


    while (
      current <= searchEnd
    ) {

      if (
        until &&
        current > until
      )
        break;


      if (
        matchesFilters(current)
      ) {

        generatedCount++;


        if (
          !countLimit ||
          generatedCount <= countLimit
        ) {

          addOccurrence(current);

        }


        if (
          countLimit &&
          generatedCount >= countLimit
        )
          break;

      }


      current =
        addDays(
          current,
          interval
        );

    }

  }


  /*
   * ----------------------------------------
   * WEEKLY
   * ----------------------------------------
   */

  else if (frequency === "WEEKLY") {

    /*
     * If BYDAY is absent, RFC behavior is
     * to use the weekday of DTSTART.
     */

    const weekdays =
      byDay.length
        ? byDay
          .filter(
            item =>
              item.ordinal === null
          )
          .map(
            item =>
              item.day
          )
        : [event.start.getDay()];


    const uniqueWeekdays =
      [...new Set(weekdays)]
        .sort(
          (a, b) =>
            a - b
        );


    let weekStart =
      cloneDate(event.start);


    /*
     * Move to the beginning of the week
     * according to WKST.
     */

    const weekStartDay =
      weekdayNumbers[
      (rule.WKST || "MO")
        .toUpperCase()
      ] ?? 1;


    const offset =
      (
        weekStart.getDay() -
        weekStartDay +
        7
      ) % 7;


    weekStart =
      addDays(
        weekStart,
        -offset
      );


    while (
      weekStart <= searchEnd
    ) {

      for (
        const weekday
        of uniqueWeekdays
      ) {

        const offsetFromWeekStart =
          (
            weekday -
            weekStartDay +
            7
          ) % 7;


        const candidate =
          addDays(
            weekStart,
            offsetFromWeekStart
          );


        candidate.setHours(
          event.start.getHours(),
          event.start.getMinutes(),
          event.start.getSeconds(),
          event.start.getMilliseconds()
        );


        candidate.calendarDate =
          dateKey(candidate);


        /*
         * Don't generate an occurrence
         * before DTSTART.
         */
        if (
          candidate <
          event.start
        )
          continue;


        if (
          candidate >
          searchEnd
        )
          continue;


        if (
          !matchesFilters(candidate)
        )
          continue;


        generatedCount++;


        if (
          countLimit &&
          generatedCount > countLimit
        )
          break;


        addOccurrence(
          candidate
        );

      }


      if (
        countLimit &&
        generatedCount >= countLimit
      )
        break;


      weekStart =
        addDays(
          weekStart,
          7 * interval
        );

    }

  }


  /*
   * ----------------------------------------
   * MONTHLY
   * ----------------------------------------
   */

  else if (frequency === "MONTHLY") {

    let monthIndex =
      event.start.getFullYear() * 12 +
      event.start.getMonth();


    const endMonth =
      searchEnd.getFullYear() * 12 +
      searchEnd.getMonth();


    while (
      monthIndex <= endMonth
    ) {

      const year =
        Math.floor(
          monthIndex / 12
        );


      const month =
        monthIndex % 12;


      /*
       * Candidate days.
       */

      const candidates =
        [];


      /*
       * BYMONTHDAY
       */

      if (byMonthDay.length) {

        const lastDay =
          daysInMonth(
            year,
            month
          );


        for (
          const value
          of byMonthDay
        ) {

          const day =
            value > 0
              ? value
              : lastDay + value + 1;


          if (
            day >= 1 &&
            day <= lastDay
          ) {

            candidates.push(
              day
            );

          }

        }

      }


      /*
       * BYDAY
       *
       * Examples:
       *
       * BYDAY=MO
       * BYDAY=1MO
       * BYDAY=-1FR
       */

      else if (byDay.length) {

        for (
          const item
          of byDay
        ) {

          if (
            item.ordinal !== null
          ) {

            const lastDay =
              daysInMonth(
                year,
                month
              );


            if (
              item.ordinal > 0
            ) {

              for (
                let day = 1;
                day <= lastDay;
                day++
              ) {

                const candidate =
                  new Date(
                    year,
                    month,
                    day
                  );


                if (
                  candidate.getDay() ===
                  item.day
                ) {

                  const occurrence =
                    Math.floor(
                      (day - 1) / 7
                    ) + 1;


                  if (
                    occurrence ===
                    item.ordinal
                  ) {

                    candidates.push(
                      day
                    );

                    break;

                  }

                }

              }

            }

            else {

              for (
                let day = lastDay;
                day >= 1;
                day--
              ) {

                const candidate =
                  new Date(
                    year,
                    month,
                    day
                  );


                if (
                  candidate.getDay() ===
                  item.day
                ) {

                  const occurrence =
                    Math.floor(
                      (lastDay - day) / 7
                    ) + 1;


                  if (
                    occurrence ===
                    Math.abs(
                      item.ordinal
                    )
                  ) {

                    candidates.push(
                      day
                    );

                    break;

                  }

                }

              }

            }

          }

          else {

            /*
             * Non-ordinal BYDAY in a monthly
             * rule means every matching weekday.
             */

            const lastDay =
              daysInMonth(
                year,
                month
              );


            for (
              let day = 1;
              day <= lastDay;
              day++
            ) {

              const candidate =
                new Date(
                  year,
                  month,
                  day
                );


              if (
                candidate.getDay() ===
                item.day
              ) {

                candidates.push(
                  day
                );

              }

            }

          }

        }

      }


      /*
       * No BYMONTHDAY/BYDAY:
       * use DTSTART's day of month.
       */

      else {

        const day =
          event.start.getDate();


        if (
          day <=
          daysInMonth(
            year,
            month
          )
        ) {

          candidates.push(
            day
          );

        }

      }


      /*
       * Remove duplicates.
       */

      const uniqueDays =
        [...new Set(candidates)]
          .sort(
            (a, b) =>
              a - b
          );


      for (
        const day
        of uniqueDays
      ) {

        const candidate =
          new Date(
            year,
            month,
            day,
            event.start.getHours(),
            event.start.getMinutes(),
            event.start.getSeconds(),
            event.start.getMilliseconds()
          );


        candidate.calendarDate =
          dateKey(candidate);


        if (
          candidate <
          event.start
        )
          continue;


        if (
          candidate >
          searchEnd
        )
          continue;


        if (
          !matchesFilters(candidate)
        )
          continue;


        generatedCount++;


        if (
          countLimit &&
          generatedCount > countLimit
        )
          break;


        addOccurrence(
          candidate
        );

      }


      if (
        countLimit &&
        generatedCount >= countLimit
      )
        break;


      monthIndex +=
        interval;

    }

  }


  /*
   * ----------------------------------------
   * YEARLY
   * ----------------------------------------
   */

  else if (frequency === "YEARLY") {

    let year =
      event.start.getFullYear();


    while (
      year <=
      searchEnd.getFullYear()
    ) {

      const months =
        byMonth.length
          ? byMonth
          : [
            event.start.getMonth() + 1
          ];


      for (
        const monthNumber
        of months
      ) {

        const month =
          monthNumber - 1;


        if (
          month < 0 ||
          month > 11
        )
          continue;


        const lastDay =
          daysInMonth(
            year,
            month
          );


        const candidates =
          [];


        /*
         * BYMONTHDAY
         */

        if (byMonthDay.length) {

          for (
            const value
            of byMonthDay
          ) {

            const day =
              value > 0
                ? value
                : lastDay + value + 1;


            if (
              day >= 1 &&
              day <= lastDay
            ) {

              candidates.push(
                day
              );

            }

          }

        }


        /*
         * BYDAY
         */

        else if (byDay.length) {

          for (
            const item
            of byDay
          ) {

            for (
              let day = 1;
              day <= lastDay;
              day++
            ) {

              const candidate =
                new Date(
                  year,
                  month,
                  day
                );


              if (
                candidate.getDay() !==
                item.day
              )
                continue;


              if (
                item.ordinal === null
              ) {

                candidates.push(
                  day
                );

              }

              else if (
                item.ordinal > 0
              ) {

                const occurrence =
                  Math.floor(
                    (day - 1) / 7
                  ) + 1;


                if (
                  occurrence ===
                  item.ordinal
                ) {

                  candidates.push(
                    day
                  );

                }

              }

              else {

                const occurrence =
                  Math.floor(
                    (lastDay - day) / 7
                  ) + 1;


                if (
                  occurrence ===
                  Math.abs(
                    item.ordinal
                  )
                ) {

                  candidates.push(
                    day
                  );

                }

              }

            }

          }

        }


        /*
         * Default yearly recurrence:
         * same month/day as DTSTART.
         */

        else {

          const day =
            event.start.getDate();


          if (
            day <= lastDay
          ) {

            candidates.push(
              day
            );

          }

        }


        const uniqueDays =
          [...new Set(candidates)]
            .sort(
              (a, b) =>
                a - b
            );


        for (
          const day
          of uniqueDays
        ) {

          const candidate =
            new Date(
              year,
              month,
              day,
              event.start.getHours(),
              event.start.getMinutes(),
              event.start.getSeconds(),
              event.start.getMilliseconds()
            );


          candidate.calendarDate =
            dateKey(candidate);


          if (
            candidate <
            event.start
          )
            continue;


          if (
            candidate >
            searchEnd
          )
            continue;


          if (
            !matchesFilters(candidate)
          )
            continue;


          generatedCount++;


          if (
            countLimit &&
            generatedCount > countLimit
          )
            break;


          addOccurrence(
            candidate
          );

        }

      }


      if (
        countLimit &&
        generatedCount >= countLimit
      )
        break;


      year +=
        interval;

    }

  }


  /*
   * ----------------------------------------
   * Unsupported frequency
   * ----------------------------------------
   */

  else {

    return [event];

  }


  /*
   * ----------------------------------------
   * Safety fallback
   *
   * If expansion somehow produced nothing,
   * retain the original event.
   * ----------------------------------------
   */

  if (!occurrences.length)
    return [event];


  /*
   * Sort occurrences chronologically.
   */

  occurrences.sort(
    (a, b) =>
      a.start - b.start
  );


  return occurrences;

}






function parseICS(text) {

  const lines = text.split(/\r?\n/);

  const events = [];

  let current = null;


  for (let line of lines) {


    line = line.trim();


    if (line === "BEGIN:VEVENT") {

      current = {
        title: "Untitled",
        allDay: false,
        location: "",
        rrule: null
      };

    }


    if (!current)
      continue;



    if (line.startsWith("SUMMARY:")) {

      current.title =
        line.replace("SUMMARY:", "").trim();

    }



    if (line.startsWith("LOCATION:")) {

      current.location =
        line.replace("LOCATION:", "").trim();

    }



    if (line.startsWith("DTSTART")) {

      const separator = line.indexOf(":");

      const property =
        line.slice(0, separator);

      const value =
        line.slice(separator + 1);

      const timezoneMatch =
        property.match(/TZID=([^;:]+)/);

      const timezone =
        timezoneMatch
          ? timezoneMatch[1]
          : null;

      current.start =
        parseDate(value, timezone);

      current.allDay =
        !value.includes("T");
    }



    if (line.startsWith("DTEND")) {

      const separator = line.indexOf(":");

      const property =
        line.slice(0, separator);

      const value =
        line.slice(separator + 1);

      const timezoneMatch =
        property.match(/TZID=([^;:]+)/);

      const timezone =
        timezoneMatch
          ? timezoneMatch[1]
          : null;

      current.end =
        parseDate(value, timezone);
    }


    if (line.startsWith("RRULE:")) {

      current.rrule =
        line.slice(6).trim();

    }



    if (line === "END:VEVENT") {

      if (current.start) {

        events.push(
          ...expandRecurringEvent(current)
        );

      }

      current = null;

    }

  }


  return events;

}







function getCalendarCacheKey(calendar) {

  return (
    `${CACHE_KEY}:` +
    calendar.calendarLinks
      .split("\n")
      .map(x => x.trim())
      .filter(Boolean)
      .join("|")
  );

}


function serializeEvents(events) {

  return events.map(event => ({

    ...event,

    start:
      event.start
        ? event.start.toISOString()
        : null,

    startCalendarDate:
      event.start?.calendarDate || null,

    end:
      event.end
        ? event.end.toISOString()
        : null,

    endCalendarDate:
      event.end?.calendarDate || null,

    exdates:
      event.exdates
        ? event.exdates.map(date => ({
          value:
            date.toISOString(),

          calendarDate:
            date.calendarDate || null
        }))
        : []

  }));

}


function deserializeEvents(events) {

  return events.map(event => {

    const start =
      event.start
        ? new Date(event.start)
        : null;

    const end =
      event.end
        ? new Date(event.end)
        : null;


    if (start) {

      start.calendarDate =
        event.startCalendarDate ||
        `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;

    }


    if (end) {

      end.calendarDate =
        event.endCalendarDate ||
        `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;

    }


    return {

      ...event,

      start,

      end,

      exdates:
        (event.exdates || []).map(item => {

          const parsed =
            new Date(item.value);

          parsed.calendarDate =
            item.calendarDate ||
            `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;

          return parsed;

        })

    };

  });

}


function saveCalendarCache(calendar, events) {

  try {

    const key =
      getCalendarCacheKey(calendar);


    const data = {

      savedAt: Date.now(),

      events:
        serializeEvents(events)

    };


    localStorage.setItem(
      key,
      JSON.stringify(data)
    );

  }
  catch (err) {

    console.warn(
      "[Folio] Failed to cache calendar:",
      err
    );

  }

}


function loadCalendarCache(calendar) {

  try {

    const key =
      getCalendarCacheKey(calendar);


    const raw =
      localStorage.getItem(key);


    if (!raw)
      return null;


    const data =
      JSON.parse(raw);


    if (
      !data ||
      !Array.isArray(data.events)
    )
      return null;


    return {

      savedAt:
        data.savedAt || 0,

      events:
        deserializeEvents(data.events)

    };

  }
  catch (err) {

    console.warn(
      "[Folio] Failed to read calendar cache:",
      err
    );

    return null;

  }

}













function formatTime(date) {

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: is24Hour ? false : true
  });

}



function eventHTML(event) {

  return `

  <div style="
    padding:8px 0;
    border-bottom:1px solid rgba(255,255,255,0.08);
  ">

    <div style="font-weight:600;">
      ${event.title}
    </div>


    <div style="opacity:.65;font-size:.85em;">

    ${event.allDay
      ?
      "All day"
      :
      formatTime(event.start) +
      (event.end
        ? " - " + formatTime(event.end)
        : "")
    }

    ${event.location
      ?
      "<br>📍 " + event.location
      :
      ""
    }

    </div>

  </div>

  `;

}



export async function init(calendar) {


  if (!calendar || !calendar.calendarLinks)
    return;



  const box = createWidget(
    "calendar-widget",
    "Calendar"
  );



  let mode =
    localStorage.getItem(MODE_KEY)
    || "list";



  box.innerHTML = `

    <button class="calendar-toggle"
      style="
      position:absolute;
      right:10px;
      top:2px;
      background:none;
      border:none;
      color:inherit;
      cursor:pointer;
      font-size:18px;
      opacity:0;
      ">
      ☰
    </button>


    <div class="calendar-content">
      Loading...
    </div>

  `;



  const content =
    box.querySelector(".calendar-content");

  box.addEventListener("mouseenter", () => {
    button.style.opacity = "1";
  });

  box.addEventListener("mouseleave", () => {
    button.style.opacity = "0";
  });

  const button =
    box.querySelector(".calendar-toggle");



  let events = [];



  async function loadCalendarFromNetwork() {

    try {

      const freshEvents = [];


      const links =
        calendar.calendarLinks
          .split("\n")
          .map(x => x.trim())
          .filter(Boolean);


      /*
       * Fetch every calendar.
       *
       * Promise.all() lets them download in parallel
       * instead of waiting for one calendar to finish
       * before starting the next one.
       */

      const responses =
        await Promise.all(

          links.map(async link => {

            const res =
              await fetch(link, {
                cache: "no-store"
              });


            if (!res.ok)
              throw new Error(
                `Calendar returned ${res.status}: ${link}`
              );


            return res.text();

          })

        );


      /*
       * Parse all calendars.
       */

      for (
        const text
        of responses
      ) {

        freshEvents.push(
          ...parseICS(text)
        );

      }


      /*
       * Sort before caching.
       */

      freshEvents.sort(
        (a, b) =>
          a.start - b.start
      );


      /*
       * Replace the current data.
       */

      events =
        freshEvents;


      /*
       * Save the already-expanded events.
       */

      saveCalendarCache(
        calendar,
        events
      );


      /*
       * Immediately update the UI.
       */

      render();


      console.log(
        "[Folio] Calendar refreshed:",
        events.length,
        "events"
      );

    }
    catch (err) {

      console.error(
        "[Folio] Calendar refresh failed:",
        err
      );


      /*
       * IMPORTANT:
       *
       * Do NOT destroy the current calendar if
       * the network request fails.
       *
       * The cached/current events remain visible.
       */

      if (!events.length) {

        content.innerHTML =
          `
        <div style="opacity:.6;">
          Failed to load calendar
        </div>
        `;

      }

    }

  }



  function render() {

    content.innerHTML = "";

    if (!events.length) {

      content.innerHTML =
        `
      <div style="opacity:.6;">
        No events found
      </div>
      `;

      return;

    }


    /*
     * Get today's calendar date.
     *
     * This deliberately ignores the current time.
     * An event on a future date must not be filtered
     * because its time is earlier than the current time.
     */
    const now = new Date();

    const todayKey =
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;


    /*
     * NEXT MODE
     */
    if (mode === "next") {

      const next =
        events.find(e => {

          if (!e.start)
            return false;

          /*
           * Future dates are always upcoming,
           * regardless of their time.
           */
          if (e.start.calendarDate) {
            return e.start.calendarDate >= todayKey &&
              e.start > now;
          }

          return e.start > now;

        });


      content.innerHTML =
        next
          ?
          `
        <div style="
          opacity:.6;
          font-size:.85em;
          margin-bottom:6px;
        ">
          Next event
        </div>

        ${eventHTML(next)}
        `
          :
          `
        <div style="opacity:.6;">
          No upcoming events
        </div>
        `;

      return;

    }


    /*
     * WEEK MODE
     */
    if (mode === "week") {

      const weekStart = new Date(now);

      weekStart.setHours(0, 0, 0, 0);


      content.innerHTML = `
      <div style="
        width:max-content;
        display:flex;
        transform-origin:top left;
      "></div>
    `;


      const week =
        content.firstElementChild;


      for (let i = 0; i < 7; i++) {

        const day =
          new Date(weekStart);

        day.setDate(
          day.getDate() + i
        );


        /*
         * Create a YYYY-MM-DD key for this
         * particular calendar day.
         */
        const dayKey =
          `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;


        /*
         * IMPORTANT:
         *
         * Do NOT compare the current time here.
         *
         * If the event is on this calendar day,
         * it belongs in this column even if its
         * start/end time is before the current time.
         */
        const todays =
          events.filter(e => {

            if (!e.start)
              return false;

            if (e.start.calendarDate)
              return e.start.calendarDate === dayKey;


            /*
             * Fallback for events that don't have
             * calendarDate attached.
             */
            const eventDay =
              new Date(e.start);

            return (
              eventDay.getFullYear() === day.getFullYear() &&
              eventDay.getMonth() === day.getMonth() &&
              eventDay.getDate() === day.getDate()
            );

          });


        const column =
          document.createElement("div");


        column.style.cssText = `
        width:140px;
        display:flex;
        flex-direction:column;
        gap:4px;
        padding:6px;
        box-sizing:border-box;
        flex-shrink:0;
      `;


        column.innerHTML = `
        <div style="
          font-weight:600;
          font-size:1em;
        ">
          ${day.toLocaleDateString([], {
          weekday: "short",
          day: "numeric"
        })}
        </div>
      `;


        todays.forEach(e => {

          column.innerHTML += `
          <div style="
            padding:4px;
            border-radius:6px;
            background:rgba(255,255,255,.08);
            font-size:.85em;
          ">

            <div>
              ${e.title}
            </div>

            <div style="opacity:.6;">
              ${e.allDay
              ? "All day"
              : formatTime(e.start)
            }
            </div>

          </div>
        `;

        });


        week.appendChild(column);

      }


      requestAnimationFrame(() => {

        const availableHeight =
          content.clientHeight;

        const naturalHeight =
          week.offsetHeight;


        if (
          naturalHeight > availableHeight &&
          availableHeight > 0
        ) {

          const scale =
            availableHeight / naturalHeight;

          week.style.transform =
            `scale(${scale})`;

        } else {

          week.style.transform =
            "scale(1)";

        }

      });


      return;

    }


    /*
     * LIST MODE
     */

    const today =
      new Date();


    events
      .filter(e => {

        if (!e.start)
          return false;


        /*
         * Future calendar dates should always
         * be considered upcoming.
         */
        if (e.start.calendarDate) {

          if (e.start.calendarDate > todayKey)
            return true;

        }


        /*
         * For today, use the actual event time.
         */
        return e.start >= today;

      })
      .slice(0, 10)
      .forEach(e => {

        content.innerHTML +=
          eventHTML(e);

      });

  }



  button.onclick = () => {


    mode =
      mode === "list"
        ?
        "next"
        :
        mode === "next"
          ?
          "week"
          :
          "list";


    localStorage.setItem(
      MODE_KEY,
      mode
    );


    render();

  };



  /*
   * ----------------------------------------
   * STARTUP
   * ----------------------------------------
   *
   * First load the cached, already-parsed
   * calendar immediately.
   *
   * This makes the widget appear instantly.
   */

  const cached =
    loadCalendarCache(calendar);


  if (
    cached &&
    cached.events.length
  ) {

    events =
      cached.events;


    events.sort(
      (a, b) =>
        a.start - b.start
    );


    render();


    console.log(
      "[Folio] Loaded calendar from cache:",
      events.length,
      "events"
    );

  }


  /*
   * ----------------------------------------
   * NETWORK REFRESH
   * ----------------------------------------
   *
   * Fetch fresh data immediately.
   *
   * This happens in the background and does
   * not block the cached calendar from being
   * displayed.
   */

  loadCalendarFromNetwork();


  /*
   * ----------------------------------------
   * 30 SECOND REFRESH
   * ----------------------------------------
   */

  setInterval(
    loadCalendarFromNetwork,
    REFRESH_INTERVAL
  );

}