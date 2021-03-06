import React, { Component } from 'react'
import SimpleStorageContract from '../build/contracts/SimpleStorage.json'
import DeckContract from '../build/contracts/Deck.json'
import getWeb3 from './utils/getWeb3'
import Table from './components/Table.jsx';
import ActionBar from './components/ActionBar.jsx';
import Chatbox from './components/Chatbox.jsx';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import AppBar from 'material-ui/AppBar';
import FlatButton from 'material-ui/FlatButton';
import $ from 'jquery';

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'



const contract = require('truffle-contract')
const simpleStorage = contract(SimpleStorageContract)
const deck = contract(DeckContract)


class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      storageValue: 0,
      web3: null,
      account: null,
      action: -1,
      seat1: 'nobus/blank.png',
      seat2: 'nobus/blank.png',
      seat3: 'nobus/blank.png',
      seat4: 'nobus/blank.png',
      stack1: 0,
      stack2: 0,
      stack3: 0,
      stack4: 0,
      bet1: 0,
      bet2: 0,
      bet3: 0,
      bet4: 0,
      pot: 0,
      active1: 1,
      active2: 1,
      active3: 1,
      active4: 1,
      actionDot: {
        position: 'fixed',
        left: '39%',
        top: '70%',
        width: '0%'
      },
      sliderMax: 100
    };

    this.deckInstance = null;
    this.mySeat = -1;
    this.myCurrentBet = 0;
    this.dotLocation = {0: {position: 'fixed', width:'5%', left: '63%', top: '35%'},
                        1: {position: 'fixed', width:'5%', left: '39%', top: '70%'},
                        2: {position: 'fixed', width:'5%', left: '26%', top: '70%'},
                        3: {position: 'fixed', width:'5%', left: '1%', top: '35%'},
                        101: {position: 'fixed', width:'0%', left: '0%', top: '0%'}};

    this.deal = this.deal.bind(this);
    this.winner = this.winner.bind(this);
    this.shuffle = this.shuffle.bind(this);
    this.takeSeat = this.takeSeat.bind(this);
    this.bet = this.bet.bind(this);
    this.notTurn = this.notTurn.bind(this);
    this.fold = this.fold.bind(this);

  }

  componentWillMount() {

    getWeb3
    .then(results => {

      results.web3.eth.defaultAccount = results.web3.eth.accounts[0];

      this.setState({
        web3: results.web3
      });

      this.instantiateContract()
    })
    .catch(() => {
      console.log('Error finding web3.')
    });
  }

  instantiateContract() {


    deck.setProvider(this.state.web3.currentProvider);

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      this.setState({account: accounts[1]})

      deck.deployed().then((instance)=>{
        this.deckInstance= instance;

        instance.SendStack().watch((err, event) => {
          this.setState({
            ['stack' + (event.args.seat.toNumber() + 1)]: event.args.chips.toNumber()
          });
        });

        instance.Deal().watch((err, event) => {
          var turn = event.args.first.toNumber();
          console.log(turn + ' is the dealer');
          this.setState({action: turn,
                        actionDot: this.dotLocation[turn],
                        active1: 1, active2: 1, active3: 1, active4: 1
                      });

          this.deal();
        });

        // instance.getGameState({gas: 40000000}).then((result) => {
        //   console.log(result);
        // });

        instance.AdvanceRound().watch((err, event) => {
          var turn = event.args.action.toNumber();
          console.log(turn);

          this.setState({action: turn});
          this.setState({actionDot: this.dotLocation[turn]});
          if(turn === 101) {
            this.winner();
          } else {
            this.updatePlayerBets();
          }
        });

        instance.Test().watch((err, event) => {
          console.log(event.args.card.toNumber());
        });
      })
    })
  }

  updatePlayerBets() {
    this.deckInstance.getCurrentPlayerBet(0).then((result) => {
      this.setState({bet1: result.toNumber()})
      console.log(result);
    });
    this.deckInstance.getCurrentPlayerBet(1).then((result) => this.setState({bet2: result.toNumber()}));
    this.deckInstance.getCurrentPlayerBet(2).then((result) => this.setState({bet3: result.toNumber()}));
    this.deckInstance.getCurrentPlayerBet(3).then((result) => this.setState({bet4: result.toNumber()}));

    this.deckInstance.getCurrentPlayerBet(this.mySeat).then((result) => this.myCurrentBet = result.toNumber());

    this.deckInstance.getCurrentPotSize().then((result) => this.setState({pot: result.toNumber()}))

  }

  takeSeat(seat) {
    if(seat !== -1){
      this.deckInstance.sitDown(seat, 1000);
      this.mySeat = seat;
    } else {

      if(this.mySeat !== -1){
        console.log('stand up');
        this.deckInstance.standUp(this.mySeat).then(() => this.mySeat = seat);
      }
    }

  }

  winner() {
    this.deckInstance.calcWinner().then((card) => {
      this.setState({ myCard: 'nobus/' + card + '.png' });
      this.updatePlayerBets();
    });

    this.deckInstance.playerActive(0).then((bactive) => {
      var active = bactive.toNumber();
      if(active === 2) {
        this.deckInstance.getCard(0).then((result) => this.setState({seat1: 'nobus/' + result + '.png' }));
      }
    });

    this.deckInstance.playerActive(1).then((bactive) => {
      var active = bactive.toNumber();
      if(active === 2) {
        this.deckInstance.getCard(1).then((result) => this.setState({seat2: 'nobus/' + result + '.png' }));
      }
    });

    this.deckInstance.playerActive(2).then((bactive) => {
      var active = bactive.toNumber();
      if(active === 2) {
        this.deckInstance.getCard(2).then((result) => this.setState({seat3: 'nobus/' + result + '.png' }));
      }
    });

    this.deckInstance.playerActive(3).then((bactive) => {
      var active = bactive.toNumber();

      console.log(active);
      if(active === 2) {
        this.deckInstance.getCard(3).then((result) => this.setState({seat4: 'nobus/' + result + '.png' }));
      }
    });

  }

  shuffle() {
    $(".action").children().prop('disabled',true);
    this.deckInstance.shuffle({gas: 400000000});
  }

  deal(){
    // this.deckInstance.initGame({gas: 40000000}).then(() => {
      this.deckInstance.playerActive(0).then((bactive) => {
        var active = bactive.toNumber();
        if(this.mySeat === 0 && active === 2) {
          this.setState({seat1: 'nobus/flipside.png'});
        } else if(active === 2) {
          this.deckInstance.getCard(0).then((result) => this.setState({seat1: 'nobus/' + result + '.png' }));
        } else if(active === 1) {
          this.deckInstance.getCard(0).then((result) => this.setState({seat1: 'nobus/' + result + '.png' }));

        } else {
          this.setState({seat1: 'nobus/blank.png' });
        }
      })

      this.deckInstance.playerActive(1).then((bactive) => {
        var active = bactive.toNumber();
        if(this.mySeat === 1 && active === 2) {
          this.setState({seat2: 'nobus/flipside.png'});
        } else if(active === 2) {
          this.deckInstance.getCard(1).then((result) => {
            this.setState({seat2: 'nobus/' + result + '.png' });
            console.log(result)
          })
        } else {
          this.setState({seat2: 'nobus/blank.png'});
        }
      })

      this.deckInstance.playerActive(2).then((bactive) => {
        var active = bactive.toNumber();
        if(this.mySeat === 2 && active === 2) {
          this.setState({seat3: 'nobus/flipside.png'});
        } else if(active === 2) {
          this.deckInstance.getCard(2).then((result) => this.setState({seat3: 'nobus/' + result + '.png' }));
        } else {
          this.setState({seat3: 'nobus/blank.png'});
        }
      })

      this.deckInstance.playerActive(3).then((bactive) => {
        var active = bactive.toNumber();
        if(this.mySeat === 3 && active === 2) {
          this.setState({seat4: 'nobus/flipside.png'});
        } else if(active === 2) {
          this.deckInstance.getCard(3).then((result) => this.setState({seat4: 'nobus/' + result + '.png' }));
        } else {
          this.setState({seat4: 'nobus/blank.png'});
        }
      })
    //})
  }

  bet(raise) {
    if(this.mySeat === this.state.action){
      this.deckInstance.bet(20, this.mySeat, raise, {gas: 4000000});
      this.deckInstance.nextToAction();
    } else {
      this.notTurn();
    }
  }

  fold() {
    if(this.mySeat === this.state.action){
      if(this.mySeat === 0) {
        this.deckInstance.getCard(0).then((result) => this.setState({seat1: 'nobus/' + result + '.png' }));
        this.setState({active1: .3})
      }
      if(this.mySeat === 1) {
        this.deckInstance.getCard(1).then((result) => this.setState({seat2: 'nobus/' + result + '.png' }));
        this.setState({active2: .3})
      }
      if(this.mySeat === 2) {
        this.deckInstance.getCard(2).then((result) => this.setState({seat3: 'nobus/' + result + '.png' }));
        this.setState({active3: .3})
      }
      if(this.mySeat === 3) {
        this.deckInstance.getCard(3).then((result) => this.setState({seat4: 'nobus/' + result + '.png' }));
        this.setState({active4: .3})
      }

      this.deckInstance.fold(this.mySeat);
      this.deckInstance.nextToAction();
    } else {
     this.notTurn();
   }
  }

  notTurn() {
    console.log('Not your turn. Its ' + this.state.action + ' and your ' + this.mySeat );
  }


  render() {
    let img = {
      width: 100,
      height: 100
    }

    let cards = {
      width: 70,
      height: 100,
    }

    let styles = {
      navbar: {position: "fixed", top: 0, left: 0, backgroundColor: "#181818"}
    }

    let actionDot = this.state.actionDot;

    return (

      <MuiThemeProvider>
        <div>
          <AppBar title="OFFSUIT" style={styles.navbar} showMenuIconButton={false} iconElementRight={<FlatButton label="LEAVE TABLE"/>} />

          <img src="action.png" style={actionDot}/>

          <Table id="table"
            active1={this.state.active1} active2={this.state.active2} active3={this.state.active3} active4={this.state.active4}
            seat1={this.state.seat1} seat2={this.state.seat2} seat3={this.state.seat3} seat4={this.state.seat4}
            stack1={this.state.stack1} stack2={this.state.stack2} stack3={this.state.stack3} stack4={this.state.stack4} 
            bet1={this.state.bet1} bet2={this.state.bet2} bet3={this.state.bet3} bet4={this.state.bet4}
            pot={this.state.pot}
            />
          <div className="action">
            <ActionBar sliderMax={this.sliderMax} bet={() => this.bet(false)} fold={this.fold}/>
          </div>

          <div id="chatbox">
            <div className="App">
              <main className="container">
                <div className="pure-g">
                  <div className="pure-u-1-1">
                    <h1>Offsuit</h1>
                    <p>GameRoom : Easak's home game</p>

                    <img style={cards} src={this.state.seat1}/>
                    <img style={cards} src={this.state.seat2} />
                    <img style={cards} src={this.state.seat3}/>
                    <img style={cards} src={this.state.seat4} />

                    <br/>

                    <button onClick={this.state.action === this.mySeat ? () => this.bet(false) : this.notTurn}>BET!</button>
                    <button onClick={this.shuffle}>SHUFFLE! </button>
                    <button onClick={this.deal}>DEAL! </button>
                    <button onClick={this.winner}>Calc Winner! </button>


                    <p> Winner: </p>
                    <img style={cards} src={this.state.myCard}/>
                    <p>One: {this.state.stack1}, Two: {this.state.stack2}, Three: {this.state.stack3}, Four: {this.state.stack4}</p>
                    <button onClick={() => this.takeSeat(0)}>Seat 1</button>
                    <button onClick={() => this.takeSeat(1)}>Seat 2</button>
                    <button onClick={() => this.takeSeat(2)}>Seat 3</button>
                    <button onClick={() => this.takeSeat(3)}>Seat 4</button>
                    <button onClick={() => this.takeSeat(-1)}>Stand Up</button>
                  </div>

                </div>
              </main>
            </div>
          </div>
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App
