'use strict';

module.exports = {
    filtersToMap(filters) {
        let filtersMap = new Map();
        filters.forEach((filter)=> {
            let isActuate = true;
            if (filter[0] == '-') {
                isActuate = false;
                filter = filter.substr(1);
            }
            filtersMap.set(filter, isActuate);
        });
        return filtersMap;
    },

    isMatchesFilter (str, filters) {
        let corrects = [];
        filters.forEach((isActuate, filter) => {
            corrects.push(Boolean(~str.indexOf(filter)) == isActuate);
        });
        return corrects.every((coorect)=> coorect == true);
    },

    getTimestamp(log) {
        return Date.parse(log.substr(0, log.indexOf('ip')).trim());
    }
};