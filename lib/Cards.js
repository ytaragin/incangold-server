



class Card {
    /*    #img;
        #gameMgr;
        #name;
    */

    constructor(name, img) {
        this.img = img;
        this.name = name;
        this.cname = this.constructor.name;
    }


    getStateFields() {
        return ["img", "name"]
    }



    play() {
        throw "Unimplemented Function";
    }
}

class ArtifactCard extends Card {
    constructor({img}) {
        super("Artifact", img);
    }

    play(game) {
        game.playArtifact(this);
    }

}

class HazardCard extends Card {
    //   #type;

    constructor({img, type}) {
        super(`Hazard: ${type}`, img);
        this.type = type;
    }

    getStateFields() {
        return super.getStateFields().concat(["type"]);
    }


    play(game) {
        game.playHazard(this);
    }

    // get type() {
    //     return this.type;
    // }



}

class TreasureCard extends Card {
    //   #value;

    constructor({img, value}) {
        super(`Treasure: ${value}`, img);
        this.value = value;
    }

    getStateFields() {
        return super.getStateFields().concat(["value"]);
    }

    play(game) {
       game.playTreasure(this);
    }

    //   get value() {
    //       return this.value;
    //   }


}

function createCard(obj) {
    const factory = {
        TreasureCard,
        HazardCard,
        ArtifactCard
    }

    return new factory[obj.cname](obj);
}

function recreateCards(jsonArr){
    return jsonArr.map(json => createCard(json))
}

module.exports = {
    TreasureCard,
    HazardCard,
    ArtifactCard,
    recreateCards
}