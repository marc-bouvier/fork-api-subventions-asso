import associationService from "../../association.service";
import ComponentCore from "../../../../shared/Component.core";
import { mapSubventionsAndVersements, sortByColumn } from "../../association.helper";

export default class DashboardCore extends ComponentCore {
    constructor(association) {
        super();
        this.association = association;

        // Manage Head and filter of table
        this.elements = [];

        this.computed = {
            years: [],
            computed: [],
            exercices: [],
            etablissements: [],
            selectedEtablissement: 0,
            selectedExerciceIndex: 0,
            siretSiege: this.association.siren + this.association.nic_siege,
            currentSortColumn: null,
            sortDirection: "asc"
        };

        this.scoped = {
            elements: [],
            versementsAmount: 0,
            subventionAmount: 0,
            subventionRequestedAmount: 0,
            percentSubvention: 0
        };
    }

    mount() {
        const subventionsPromise = associationService.getSubventions(this.association.siren);
        const versementsPromise = associationService.getVersements(this.association.siren);

        return Promise.all([subventionsPromise, versementsPromise])
            .then(([subventions, versements]) => {
                this.elements = mapSubventionsAndVersements({ subventions, versements });

                this.computed.years = [...new Set(this.elements.map(element => element.year))].sort((a, b) => a - b);
                const sirets = [...new Set(this.elements.map(element => element.siret))];

                this.computed.exercices = this.buildExercices();
                this.computed.selectedExerciceIndex = this.computed.years.length - 1;
                this.computed.etablissements = this.buildEtablissementList(sirets);

                this.applyScope();
            })
            .catch(e => console.log(e));
    }

    filterByEtablissement(etablissement) {
        this.computed.selectedEtablissement = etablissement;
        this.applyScope();
    }

    filterByExercice(exerciceIndex) {
        this.computed.selectedExerciceIndex = exerciceIndex;
        this.applyScope();
    }

    sortByColumn(column) {
        const oldSort = this.computed.currentSortColumn;
        this.computed.currentSortColumn = column;

        if (oldSort === column) {
            this.computed.sortDirection = this.computed.sortDirection == "asc" ? "desc" : "asc";
            this.scoped.elements = this.scoped.elements.reverse();

            this.render();
            return;
        }
        this.computed.sortDirection = "asc";

        let path = "";
        const [object, ...attribute] = column.split(".");

        if (object === "subvention") {
            path = ["subvention", attribute[0] === "project-name" ? "actions_proposee[0].intitule" : attribute]
                .flat()
                .join(".");
        } else {
            path = [
                "versements",
                attribute[0] === "centreFinancier"
                    ? "[0].centreFinancier"
                    : attribute[0] === "date"
                    ? ".lastDate"
                    : attribute[0] === "montant"
                    ? ".amount"
                    : ""
            ].join("");
        }

        this.scoped.elements = sortByColumn(this.scoped.elements, path);

        this.render();
    }

    resetSort() {
        this.computed.sortDirection = "asc";
        this.computed.currentSortColumn = null;
    }

    applyScope() {
        if (!this.elements.length) return;

        const currentSiret = this.computed.etablissements[this.computed.selectedEtablissement].value;
        const currentYear = this.computed.years[this.computed.exercices[this.computed.selectedExerciceIndex].value];

        this.scoped.elements = this.elements.filter(element => {
            const goodSiret = currentSiret == "*" ? true : element.siret === currentSiret;
            const goodYear = element.year == currentYear;

            return goodSiret && goodYear;
        });

        this.scoped.versementsAmount = this.scoped.elements.reduce((acc, element) => {
            if (!element.versements) return acc;
            return acc + element.versements.reduce((total, versement) => total + versement.amount, 0);
        }, 0);

        this.scoped.subventionAmount = this.scoped.elements.reduce((acc, element) => {
            if (!element.subvention || !element.subvention.montants) return acc;
            return acc + (element.subvention.montants.accorde || 0);
        }, 0);

        this.scoped.subventionRequestedAmount = this.scoped.elements.reduce((acc, element) => {
            if (!element.subvention || !element.subvention.montants) return acc;
            return acc + (element.subvention.montants.demande || 0);
        }, 0);

        this.scoped.percentSubvention = (
            (this.scoped.subventionAmount / this.scoped.subventionRequestedAmount) * 100 || 100
        ).toFixed(0);

        this.resetSort();

        this.render();
    }

    buildRendererData() {
        return {
            elements: this.scoped.elements,
            versementsAmount: this.scoped.versementsAmount,
            subventionAmount: this.scoped.subventionAmount,
            subventionRequestedAmount: this.scoped.subventionRequestedAmount,
            percentSubvention: this.scoped.percentSubvention,

            etablissements: this.computed.etablissements,
            selectedEtablissement: this.computed.etablissements[this.computed.selectedEtablissement],

            exercices: this.computed.exercices,
            selectedExercice: this.computed.exercices[this.computed.selectedExerciceIndex],
            selectedYear: this.computed.years[this.computed.exercices[this.computed.selectedExerciceIndex].value],

            currentSort: this.computed.currentSortColumn,
            sortDirection: this.computed.sortDirection
        };
    }

    buildEtablissementList(sirets) {
        return [
            {
                value: "*",
                label: "Pour l'ensemble des établissements (siège + établissements)"
            },
            ...sirets
                .map(siret => ({
                    value: siret,
                    label:
                        siret === this.computed.siretSiege
                            ? `Pour le siège (${siret})`
                            : `Pour l'établissement (${siret})`
                }))
                .sort(etablisement => (etablisement.value === this.computed.siretSiege ? -1 : 0))
        ];
    }

    buildExercices() {
        return this.computed.years.map((year, i) => ({ value: i, label: `Exercice ${year} (année civile)` }));
    }
}