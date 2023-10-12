
module.exports = function SupportStarcVelika(mod) {
	let enabled = true,
	myCoinsAfter,
	myCoinsBefore,
	myChannel,
	nextChannel,
	isStarcVelika = false,
	debug =false;
	const MaxChannel = 10; //velika最大チャンネル(0～9)
	
	//mod.settings.debug = true;

	function reset() {
		myCoinsAfter = null;
		myCoinsBefore = null;
		myChannel = 0; 
		nextChannel = null;
		isStarcVelika =false;
	}

	mod.game.initialize("contract");
	mod.game.initialize("inventory");

	mod.command.add("ssv", {
		"$none": () => { //mod自体のon/off
			enabled = !enabled;
			mod.command.message(`Module ${ enabled ? "enabled" : "disabled"}`);
		},
		"debug": () => {
			debug = !debug;
			mod.command.message(`${ debug ? "toolbox debug log :<font color=\"#5dce6a\">on</font>" : "toolbox debug log :off"}`);
		}
	})
	//キャラログイン時
	mod.game.on('enter_game', () => { 
		reset();
	})

	//ログイン時、zone移動時、チャンネル変更時
	mod.hook("S_CURRENT_CHANNEL", 2, event => {
		myChannel = Number(event.channel);
		dLog("S_CC channel :"+myChannel);
	});

	mod.game.contract.on('begin', (type, id) => {
		dLog("contract_begin type :"+type);
		dLog("contract_begin id :"+id);

		//9はNPCの店全般のようなので割りとヒットしてしまう。debug時はtype9以外でも許可し、倉庫でテスト可とする。
		if (mod.game.me.zone === 7005 && (type == 9 || debug) && enabled  ) {
			isStarcVelika = true;
			if(myCoinsBefore === null)  myCoinsBefore = mod.game.inventory.getTotalAmountInBagOrPockets(204069);
			dLog("contract_begin myCoinsBefore :"+myCoinsBefore);
		} else {
			isStarcVelika = false;  //starcでない場合はendで無視する用
		}
	});

	mod.game.contract.on('end', (how) => {
		if (mod.game.me.zone === 7005 && isStarcVelika && enabled  ) {
			myCoinsAfter = mod.game.inventory.getTotalAmountInBagOrPockets(204069);
			dLog("contract_end myCoinsAfter :"+myCoinsAfter);
			if (myCoinsAfter >= myCoinsBefore+5 ) {
				nextChannel = myChannel+1;
				dLog("contract_end nextChannel :"+nextChannel);
				if(nextChannel > MaxChannel) nextChannel = 1; //10ch(=9)より大きい値の場合はch1に移動するので、コレはやらなくてもいいが一応。
				mod.send('C_SELECT_CHANNEL', 1, {
					unk: 1,
					zone: 7005,
					channel: nextChannel-1 //この数値はch1の場合0
				})
				mod.command.message(`Switching Channel : ${nextChannel} `.clr('00FF33'));
			}
		}
	});

	mod.hook('S_SELECT_CHANNEL', 1, event=> {
		dLog("S_SELECT_CHANNEL");
		//5枚購入後+チャンネル移動後はコイン数初期化。※このイベントの方がS_CURRENT_CHANNELより先（なので初期化できる）。購入後以外のチャンネル移動では初期化しない（けどしてもいいかも）
        if (mod.game.me.zone === 7005 && (myChannel != nextChannel)) myCoinsBefore = null; 
   });

	function dLog(logMessage){
		if (debug) mod.log(logMessage);
	}
};