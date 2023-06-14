const request = require('request-promise');
const fs = require('fs')

const year = 2023

const getGehalt = function (bJahr) {
    var url = `https://onlinerechner.haude.at/haude/brutto-netto-rechner-2013/json/${year}/${bJahr}/brutto/jaerlich/0/0/Angestellter/0/false/0/0/keindz/keine/0/true/false/true/08773489/0/0/false/0`;

    return request.get(url).then(body => {
        const obj = JSON.parse(body);
        return { bMonat: bJahr / 12, bJahr, nMonat: obj["Netto_DN"]["Monat"], nMonat13: obj["Netto_DN"]["Urlaubszuschuss"], nMonat14: obj["Netto_DN"]["Weihnachtsgeld"], nMonatDurchschnitt: obj["Netto_DN"]["Durchschnitt"], nJahr: obj["Netto_DN"]["Jahr"] }
    }).catch(function (err) { // if rp.get rejects (e.g. 500), do this:
        console.log(err)
    });;
}

var toFixed = function (n) {
    return (Math.round(n * 100) / 100).toFixed(2);
}

const bereich = [30000, 120000];
var counter = 0;
var zeilen = [];
for(var i = bereich[0]; i <= bereich[1]; i+=1000) {
    getGehalt(i).then(gehalt => {
        var bruttoJahr = toFixed(gehalt.bJahr);
        var bruttoMonat = toFixed(gehalt.bMonat);
        var nettoJahr = toFixed(gehalt.nJahr);
        var nettoMonat = toFixed(gehalt.nMonat);
        var nettoMonat13 = toFixed(gehalt.nMonat13);
        var nettoMonat14 = toFixed(gehalt.nMonat14);
        var nettoMonatDurchschnitt = toFixed(gehalt.nMonatDurchschnitt);
        var s = `${bruttoMonat};${bruttoJahr};${nettoMonat};${nettoMonat13};${nettoMonat14};${nettoMonatDurchschnitt};${nettoJahr}\n`;
        zeilen.push([gehalt.bJahr, s]);
        fs.appendFileSync('gehaelter.csv', s);
        counter += 1000;
    }).then(() => {
        if (counter == bereich[1] - bereich[0] + 1000) { // done

            const exampleFile = 'BRUTTO-NETTO-AUSTRIA-2023.md';
            try {
                fs.unlinkSync(exampleFile);
            } catch (e){}

            fs.appendFileSync(exampleFile, '| brutto Monat | brutto Jahr | netto Monat | netto Urlaubszuschuss | netto Weihnachtszuschuss | netto Durchschnitt | netto Jahr |\n');
            fs.appendFileSync(exampleFile, '| :-: | :-: | :-: | :-: | :-: | :-: | :-: |\n');

            zeilen.sort(function (a, b) {
                if (a[0] < b[0]) return -1;
                if (a[0] > b[0]) return 1;
                return 0;
            });
            var s = '';
            for (var i = 0; i < zeilen.length; i++) {
                s += zeilen[i][1].replace(/;/ig, ' | ');
            }
            fs.appendFileSync(exampleFile, s);
        }
    });
}
