export const DEFAULT_POSTE = {
    Code: 'D00598',
    DispositifId: 3,
    PstStatutPosteLibelle: 'Attribué',
    PstRaisonStatutLibelle: 'Reconduction',
    FinanceurPrincipalCode: '10008',
    FinanceurAttributeurCode: '16DIV',
    AssociationBeneficiaireCode: 'E920',
    AssociationImplantationCode: 'E920',
    Annee: 2017,
    MontantSubvention: 5068,
    DateFinTriennalite: 43100,
    PstTypePosteCode: 'FONJEP',
    PleinTemps: 'Oui',
    DoublementUniteCompte: 'Non'
}

export const DEFAULT_VERSEMENT = {
    PosteCode: 'D00598',
    PeriodeDebut: 42917,
    PeriodeFin: 43008,
    DateVersement: 43070,
    MontantAPayer: 3646,
    MontantPaye: 3646
}

export const DATA_WITH_HEADER = [
    [

        {
            Code: 'E920',
            RaisonSociale: "ASSO ERABLE ****",
            EstAssociation: 'Oui',
            EstCoFinanceurPostes: 'Non',
            EstFinanceurPostes: 'Non',
            SiretOuRidet: '00000000000000',
            CodePostal: '00000',
            Ville: 'Paris',
            ContactEmail: 'exemple@beta.gouv.fr'
        },
        {
            Code: '16DIV',
            RaisonSociale: "CENTRE D'INFO ****",
            EstAssociation: 'Non',
            EstCoFinanceurPostes: 'Non',
            EstFinanceurPostes: 'Non',
            SiretOuRidet: '00000000000000',
            CodePostal: '00000',
            Ville: 'Paris',
            ContactEmail: 'exemple@beta.gouv.fr'
        }
    ],
    [
        DEFAULT_POSTE,
        {
            Code: 'J10540',
            DispositifId: 2,
            PstStatutPosteLibelle: 'Attribué',
            PstRaisonStatutLibelle: 'Reconduction',
            FinanceurPrincipalCode: '16DIV',
            FinanceurAttributeurCode: '16DIV',
            AssociationBeneficiaireCode: 'E920',
            AssociationImplantationCode: 'E920',
            Annee: 2017,
            MontantSubvention: 6666,
            DateFinTriennalite: 43465,
            PstTypePosteCode: 'FONJEP',
            PleinTemps: 'Oui',
            DoublementUniteCompte: 'Non'
        }
    ],
    [
        DEFAULT_VERSEMENT,
        {
            PosteCode: DEFAULT_VERSEMENT.PosteCode,
            PeriodeDebut: DEFAULT_VERSEMENT.PeriodeDebut + 50,
            PeriodeFin: DEFAULT_VERSEMENT.PeriodeFin + 50,
            DateVersement: DEFAULT_VERSEMENT.DateVersement,
            MontantAPayer: DEFAULT_VERSEMENT.MontantAPayer,
            MontantPaye: DEFAULT_VERSEMENT.MontantPaye
        }
    ],
    [
        { Code: 'DOUBLE', Libelle: 'UNITE DE COMPTE DOUBLEE' },
        { Code: 'FONJEP', Libelle: 'Poste FONJEP' },
        { Code: 'PSTEMP', Libelle: 'POSTES EMPOI FONJEP (100 %)' },
        { Code: 'FONBIS', Libelle: 'PROLONGATION PAS DE FRAIS' }
    ],
    [
        { ID: 1, Libelle: "FONJEP Jeunesse éducation populaire", FinanceurCode: 10004 },
        { ID: 2, Libelle: "FONJEP Cohésion sociale", FinanceurCode: 10005 },
        { ID: 3, Libelle: "FONJEP Politique de la ville", FinanceurCode: 10008 },
        { ID: 4, Libelle: "FONJEP Guid'Asso", FinanceurCode: 10009 },
        { ID: 5, Libelle: "FONJEP Éducation à la citoyenneté et à la solidarité internationale (ECSI)", FinanceurCode: 10010 },
        { ID: 6, Libelle: "FONJEP Culture", FinanceurCode: 10012 },
        { ID: 7, Libelle: "FONJEP Centre de ressour ces et d'information des bénévoles", FinanceurCode: 10016 },
        { ID: 8, Libelle: "FONJEP Jeunes", FinanceurCode: 10017 }
    ]
]


export const RAW_DATA = [
    [
        [
            'Code',
            'RaisonSociale',
            'EstAssociation',
            'EstCoFinanceurPostes',
            'EstFinanceurPostes',
            'SiretOuRidet',
            'CodePostal',
            'Ville',
            'ContactEmail'
        ],
        [
            1234,
            "CENTRE D'INFO ****",
            'Oui',
            'Non',
            'Non',
            '00000000000000',
            '00000',
            'Paris',
            'exemple@beta.gouv.fr'
        ]
    ],
    [
        [
            'Code',
            'DispositifId',
            'PstStatutPosteLibelle',
            'PstRaisonStatutLibelle',
            'FinanceurPrincipalCode',
            'FinanceurAttributeurCode',
            'AssociationBeneficiaireCode',
            'AssociationImplantationCode',
            'Annee',
            'MontantSubvention',
            'DateFinTriennalite',
            'PstTypePosteCode',
            'PleinTemps',
            'DoublementUniteCompte'
        ],
        [
            'J10540', 3, 'Attribué',
            'Reconduction', '1234',
            1234, 1234,
            1234, 2017,
            6666, 43465,
            'FONJEP', 'Oui',
            'Non'
        ]
    ],
    // TODO: add versements
    [
        ["PosteCode", "PeriodeDebut", "PeriodeFin", "DateVersement", "MontantAPayer", "MontantPaye"],
        ["J10540", "1/1/2017", "31/3/2017", "26/1/2017", "1 777,00 €", "1 777,00 €"],
        ["J10540", "1/4/2017", "30/6/2017", "27/4/2017", "1 777,00 €", "1 777,00 €"]
    ],
    [
        ['Code', 'Libelle'],
        ['DOUBLE', 'UNITE DE COMPTE DOUBLEE'],
        ['FONJEP', 'Poste FONJEP'],
        ['PSTEMP', 'POSTES EMPOI FONJEP (100 %)'],
        ['FONBIS', 'PROLONGATION PAS DE FRAIS']
    ],
    [
        ['ID', 'Libelle', 'FinanceurCode'],
        [1, 'FONJEP Jeunesse éducation populaire', 10004],
        [2, 'FONJEP Cohésion sociale', 10005],
        [3, 'FONJEP Politique de la ville', 10008],
        [4, "FONJEP Guid'Asso", 10009],
        [5, 'FONJEP Éducation à la citoyenneté et à la solidarité internationale (ECSI)', 100010],
        [6, 'FONJEP Culture', 100012],
        [7, "FONJEP Centre de ressources et d'information des bénévoles", 100016],
        [8, 'FONJEP Jeunes', 100017],
    ]
]
