const _ = require('lodash');
const Cards = require('./Cards');



class Player {
    constructor(name) {
        this.name = name;
        this.treasureInTent = 0;
        this.pendingTreasure = 0;
        this.artifactsRcvd = 0;
        this.stayNextMove = null;
    }

    addPendingTreasure(amount) {
        this.pendingTreasure += amount;
    }

    keepTreasure(extra, artifacts){
        this.treasureInTent += (extra + this.pendingTreasure);
        this.pendingTreasure = 0;

        if (artifacts > 0) {
            this.artifactsRcvd += artifacts;
            this.treasureInTent += (10 * artifacts) - 5;
        }
    }

    killPlayer() {
        this.pendingTreasure = 0;
    }

    getState() {
        return _.pick(this, ["treasureInTent", "pendingTreasure", "artifactsRcvd" ]);

    }
}

class GameInstance {

    constructor(config, state) {
        //todo - need to merge rather then overwrite
        if (!config) {
            this.config = GameInstance.defaultConfig();
        }
        else {
            this.config = config;
        }

        if (!state) {
            this.state = {
                gameMove: 0,
                moveInRound: 0,
                currentRound: 0,
                treasureWaiting: 0,
                artifactsWaiting: 0,
                playedCards: this.createDeck(),
                deck: [],
                players: [],
                activePlayers: [],
                removedCards: [],
                whichHazardsPlayed: {},
                lastCardPlayed: null,
                endOfRound: false
            }
        }
        else {
            this.state = state;
        }

    }

    static defaultConfig(){
        return {
            numPlayers: 4,
            behavior: {
                numRounds: 5,
                howManyHazardToKill: 2,
                artifactsPerRound: 1
            },
            deck: {
                hazardTypes: [
                    {type: 'Snake', image:'NoImage'},
                    {type: 'Spider', image:'NoImage'},
                    {type: 'Fire', image:'NoImage'},
                    {type: 'Rockfall', image:'NoImage'},
                    {type: 'Pit', image:'NoImage'},

                ],
                numOfEachHazard: 3,

                treasureValues: [
                    1,2,3,4,5,7,9,11,13,14,15,17, 9, 11, 3
                ],
                treasureImage: 'NoImage',
                artifactImage: 'NoImage'
            }
        }
    }



    addPlayer(name){
        if (this.state.currentRound > 0){
            throw "Game Has Started"
        }

        if (this.state.players.find( p => p.name == name ) != null) {
            throw "Player with that name exists already";
        }

        console.log(`Adding ${name} to game`);

        let p = new Player(name);
        this.state.players.push(p);
    }

    playerCount(){
        return this.state.players.length;
    }

    createDeck() {
        let treasureCards = this.config.deck.treasureValues.map(
            value => new Cards.TreasureCard({img:this.config.deck.treasureImage, value})
        );

        let hazardCards = this.config.deck.hazardTypes
            .map(obj => _.times(
                this.config.deck.numOfEachHazard,
                ()=> (new Cards.HazardCard({img:obj.img, type:obj.type }))))
            .flat();

        return [...treasureCards, ...hazardCards];
    }

    isLastRound() {
        return (this.currentRound == this.config.numRounds);
    }

    beginRound() {
        this.state.currentRound++;
        if (this.state.currentRound > this.config.numRounds) {
            throw ("Game is over already");
        }

        this.state.moveInRound=0;

        let tempDeck = this.state.playedCards.concat(this.state.deck);
        this.state.playedCards = [];
        _.times(
            this.config.behavior.artifactsPerRound,
            ()=>{
                tempDeck.push(new Cards.ArtifactCard({img:this.config.deck.artifactImage}));
            }
        );
        this.state.deck = _.shuffle(tempDeck);

        this.state.treasureWaiting = 0;
        this.state.artifactsWaiting = 0;

        this.state.lastCardPlayed = null;
        this.state.endOfRound = false;


//        this.state.whichHazardsPlayed = {};
        this.state.whichHazardsPlayed = this.config.deck.hazardTypes.reduce( (obj, haz) =>  {
            obj[haz.type] = 0;
            return obj},
            {} );


        this.state.players.forEach(p => {
            p.stayNextMove=null;
            this.state.activePlayers.push(p);
        });
    }

    isReadyForNextMove(){
        return this.state.activePlayers.filter(p => p.stayNextMove==null).length == 0;
    }

    doNextMove() {
        if(this.endOfRound){
            throw ("Round Ended");
        }


        if(!this.isReadyForNextMove()){
            throw ("Not all players have entered their move");
        }
        this.state.moveInRound++;
        this.state.gameMove++;

        let leavingPlayers = this.state.activePlayers.filter(p => !p.stayNextMove);
        this.state.activePlayers = this.state.activePlayers.filter(p => p.stayNextMove);

        this.divideSpoils(leavingPlayers);

        let nextCard = this.state.deck.shift();
        nextCard.play(this);
        this.state.lastCardPlayed = nextCard;

        if (this.state.activePlayers.length == 0) {
            this.state.endOfRound = true;
        }

        this.state.activePlayers.forEach(p => p.stayNextMove=null);
    }



    getPublicGameState() {
        let retState = _.pick(this.state, ['gameMove', 'currentRound', 'moveInRound', 'treasureWaiting', 'artifactsWaiting',
                                                  'removedCards','whichHazardsPlayed', 'lastCardPlayed', 'endOfRound'   ]);
        retState.cardsLeftInDeck = this.state.deck.length;
        retState.activePlayers = this.state.activePlayers.map(p =>  _.pick(p, ['pendingTreasure', 'name']));

        retState.removedCards = this.state.removedCards.map(c => _.pick(c, c.getStateFields()));

        return retState;
    }

    getStateForPlayer(name) {

        return this.state.players.find(p => p.name == name).getState();
    }



    playHazard(card) {
        // todo

        if (this.state.whichHazardsPlayed[card.type] == null) {
            throw "Unknown Hazard";
        }

        this.state.whichHazardsPlayed[card.type]++;

        if (this.state.whichHazardsPlayed[card.type] >= this.config.behavior.howManyHazardToKill) {
            this.state.activePlayers.forEach( p => p.killPlayer());
            this.state.activePlayers = [];
            this.state.removedCards.push(card);
        }
        else {
            this.state.playedCards.push(card);
        }

    }


    playTreasure(card) {

        const {sharePerPlayer, remaining} = this.calcShares(card.value, this.state.activePlayers.length);


        this.state.activePlayers.forEach( p => p.addPendingTreasure(sharePerPlayer));
        this.state.treasureWaiting += remaining;
        this.state.playedCards.push(card);

    }

    playArtifact(card) {
        this.state.artifactsWaiting += 1;
        this.state.removedCards.push(card);
    }

    setMove(gameMove, name, willStay) {
        let player = this.state.activePlayers.find(p=>p.name==name);
        if (player == null) {
            throw `${name} is not an active player`;
        }

        if (gameMove != this.state.gameMove+1) {
            throw `${gameMove} is not the current move`;
        }


        player.stayNextMove = willStay;
    }

    divideSpoils(leavingPlayers) {
        if (leavingPlayers.length == 0) {
            return;
        }

        const {sharePerPlayer, remaining} = this.calcShares(this.state.treasureWaiting, leavingPlayers.length)
        this.state.treasureWaiting = remaining;


        let artifactPerPlayer = 0;
        if (leavingPlayers.length == 1){
            artifactPerPlayer = this.state.artifactsWaiting;
            this.state.artifactsWaiting = 0;
        }

        leavingPlayers.forEach(p => p.keepTreasure(sharePerPlayer, artifactPerPlayer));
    }

    calcShares(amount, playerCount) {

        let sharePerPlayer = Math.trunc(amount/playerCount);
        let remaining =  amount % playerCount;

        return {
            sharePerPlayer,
            remaining,
        };
    }


}

module.exports = {
    GameInstance
}