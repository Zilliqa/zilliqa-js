export const testContract = `scilla_version 0

(* HelloWorld contract *)

import ListUtils

(***************************************************)
(*               Associated library                *)
(***************************************************)
library HelloWorld

let one_msg = 
  fun (msg : Message) => 
  let nil_msg = Nil {Message} in
  Cons {Message} msg nil_msg

let not_owner_code = Int32 1
let set_hello_code = Int32 2

(***************************************************)
(*             The contract definition             *)
(***************************************************)

contract HelloWorld
(owner: ByStr20)

field welcome_msg : String = ""

transition setHello (msg : String)
  is_owner = builtin eq owner _sender;
  match is_owner with
  | False =>
    msg = {_tag : "Main"; _recipient : _sender; _amount : Uint128 0; code : not_owner_code};
    msgs = one_msg msg;
    send msgs
  | True =>
    welcome_msg := msg;
    msg = {_tag : "Main"; _recipient : _sender; _amount : Uint128 0; code : set_hello_code};
    msgs = one_msg msg;
    send msgs
  end
end


transition getHello ()
    r <- welcome_msg;
    e = {_eventname: "getHello()"; msg: r};
    event e
end

transition multipleMsgs()
  msg1 = {_tag : "Main"; _recipient : _sender; _amount : Uint128 0};
  msg2 = {_tag : "Main"; _recipient : _sender; _amount : Uint128 0};
  msgs1 = one_msg msg1;
  msgs2 = Cons {Message} msg2 msgs1;
  send msgs2
end

transition contrAddr()
  msg1 = {_eventname : "ContractAddress"; addr : _this_address };
  event msg1
end`;

export const zrc20 = `scilla_version 0

(* This contract implements a fungible token interface a la ERC20.*)

(***************************************************)
(*               Associated library                *)
(***************************************************)
library FungibleToken

let min_int =
  fun (a : Uint128) => fun (b : Uint128) =>
  let alt = builtin lt a b in
  match alt with
  | True =>
    a
  | False =>
    b
  end

let le_int =
  fun (a : Uint128) => fun (b : Uint128) =>
    let x = builtin lt a b in
    match x with
    | True => True
    | False =>
      let y = builtin eq a b in
      match y with
      | True => True
      | False => False
      end
    end
    

(***************************************************)
(*             The contract definition             *)
(***************************************************)

contract FungibleToken
(owner : ByStr20,
 total_tokens : Uint128)

(* Initial balance is not stated explicitly: it's initialized when creating the contract. *)

field balances : Map ByStr20 Uint128 =
  let m = Emp ByStr20 Uint128 in
    builtin put m owner total_tokens
field allowed : Map ByStr20 (Map ByStr20 Uint128) = Emp ByStr20 (Map ByStr20 Uint128)

transition BalanceOf (tokenOwner : ByStr20)
  bal <- balances[tokenOwner];
  match bal with
  | Some v =>
	e = {_eventname : "BalanceOf"; address : tokenOwner; balance : v};
	event e
  | None =>
	e = {_eventname : "BalanceOf"; address : tokenOwner; balance : Uint128 0};
    event e
  end
end

transition TotalSupply ()
  e = {_eventname : "TotalSupply"; caller : _sender; balance : total_tokens};
  event e
end

transition Transfer (to : ByStr20, tokens : Uint128)
  bal <- balances[_sender];
  match bal with
  | Some b =>
    can_do = le_int tokens b;
    match can_do with
    | True =>
      (* subtract tokens from _sender and add it to "to" *)
      new_sender_bal = builtin sub b tokens;
      balances[_sender] := new_sender_bal;

      (* Adds tokens to "to" address *)
      to_bal <- balances[to];
      new_to_bal = match to_bal with
      | Some x => builtin add x tokens
      | None => tokens
      end;

  	  balances[to] := new_to_bal;
      e = {_eventname : "TransferSuccess"; sender : _sender; recipient : to; amount : tokens};
      event e
    | False =>
      (* balance not sufficient. *)
      e = {_eventname : "TransferFailure"; sender : _sender; recipient : to; amount : Uint128 0};
      event e
    end
  | None =>
    (* no balance record, can't transfer *)
  	e = {_eventname : "TransferFailure"; sender : _sender; recipient : to; amount : Uint128 0};
    event e
  end
end

transition TransferFrom (from : ByStr20, to : ByStr20, tokens : Uint128)
  bal <- balances[from];
  (* Check if _sender has been authorized by "from" *)
  sender_allowed_from <- allowed[from][_sender];
  match bal with
  | Some a =>
    match sender_allowed_from with
    | Some b =>
        (* We can only transfer the minimum of available or authorized tokens *)
        t = min_int a b;
        can_do = le_int tokens t;
        match can_do with
        | True =>
            (* tokens is what we should subtract from "from" and add to "to" *)
            new_from_bal = builtin sub a tokens;
            balances[from] := new_from_bal;
            to_bal <- balances[to];
            match to_bal with
            | Some tb =>
                new_to_bal = builtin add tb tokens;
                balances[to] := new_to_bal
            | None =>
                (* "to" has no balance. So just set it to tokens *)
                balances[to] := tokens
            end;
            (* reduce "allowed" by "tokens" *)
            new_allowed = builtin sub b tokens;
            allowed[from][_sender] := new_allowed;
            e = {_eventname : "TransferFromSuccess"; sender : from; recipient : to; amount : tokens};
            event e
        | False =>
            e = {_eventname : "TransferFromFailure"; sender : from; recipient : to; amount : Uint128 0};
            event e
        end
    | None =>
        e = {_eventname : "TransferFromFailure"; sender : from; recipient : to; amount : Uint128 0};
        event e
    end
  | None =>
	e = {_eventname : "TransferFromFailure"; sender : from; recipient : to; amount : Uint128 0};
	event e
  end
end

transition Approve (spender : ByStr20, tokens : Uint128)
  allowed[_sender][spender] := tokens;
  e = {_eventname : "ApproveSuccess"; approver : _sender; spender : spender; amount : tokens};
  event e
end

transition Allowance (tokenOwner : ByStr20, spender : ByStr20)
  spender_allowance <- allowed[tokenOwner][spender];
  match spender_allowance with
  | Some n =>
      e = {_eventname : "Allowance"; owner : tokenOwner; spender : spender; amount : n};
      event e
  | None =>
      e = {_eventname : "Allowance"; owner : tokenOwner; spender : spender; amount : Uint128 0};
      event e
  end
end`;

export const simpleDEX = `scilla_version 0

import PairUtils

(* Simple DEX : P2P Token Trades    *)
(* Disclaimer: This contract is experimental and meant for testing purposes only *)
(* DO NOT USE THIS CONTRACT IN PRODUCTION *)

library SimpleDex

(* Pair helpers *)
let fst_pair = @fst (Pair (ByStr20) (Uint128)) (Pair(ByStr20) (Uint128))
let snd_pair = @snd (Pair (ByStr20) (Uint128)) (Pair(ByStr20) (Uint128))
let getAddressFromPair = @fst (ByStr20) (Uint128)
let getValueFromPair = @snd (ByStr20) (Uint128)

(* Event for errors *)
let make_event =
  fun (label: String) =>
  fun (location: String) =>
  fun (msg: String) =>
    { _eventname : label ; raisedAt: location; message: msg}

(* Create an orderID based on the hash of the parameters *)
let createOrderId = 
  fun (tokenA : ByStr20) =>
  fun (tokenB : ByStr20) =>
  fun (valueA: Uint128) =>
  fun (valueB: Uint128) =>
  fun (expirationBlock: BNum) =>
    let hashTokenA = builtin sha256hash tokenA in
    let hashTokenB = builtin sha256hash tokenB in
    let hashValueA = builtin sha256hash valueA in
    let hashValueB = builtin sha256hash valueB in
    let hashBlock = builtin sha256hash expirationBlock in
    let nil_list = Nil {ByStr32} in
    let l1 = Cons {ByStr32} hashTokenA nil_list in
    let l2 = Cons {ByStr32} hashValueA l1 in
    let l3 = Cons {ByStr32} hashTokenB l2 in
    let l4 = Cons {ByStr32} hashValueB l3 in
    let l5 = Cons {ByStr32} hashBlock l4 in
    builtin sha256hash l5

(* Creates order "struct" *)
let createOrder =
  fun (tokenA : ByStr20) =>
  fun (tokenB : ByStr20) =>
  fun (valueA: Uint128) =>
  fun (valueB: Uint128) =>
    let p1 = Pair{ByStr20 Uint128} tokenA valueA in
    let p2 = Pair{ByStr20 Uint128} tokenB valueB in
    let finalPair = Pair { (Pair(ByStr20)(Uint128)) (Pair(ByStr20)(Uint128))} p1 p2 in
    finalPair


(* Create one transaction message *)
let transaction_msg =
  fun (recipient : ByStr20) =>
  fun (tag : String) =>
  fun (transferFromAddr: ByStr20) =>
  fun (transferToAddr: ByStr20) =>
  fun (transferAmt: Uint128) =>
    {_tag : tag; _recipient : recipient; _amount : Uint128 0;
     from: transferFromAddr; to: transferToAddr; tokens: transferAmt }

(* Wrap one transaction message as singleton list *)
let transaction_msg_as_list =
  fun (recipient : ByStr20) =>
  fun (tag : String) =>
  fun (transferFromAddr: ByStr20) =>
  fun (transferToAddr: ByStr20) =>
  fun (transferAmt: Uint128) =>
    let one_msg = 
      fun (msg : Message) => 
        let nil_msg = Nil {Message} in
        Cons {Message} msg nil_msg in
    let msg = transaction_msg recipient tag transferFromAddr transferToAddr transferAmt in
    one_msg msg

(* Compute the new pending return val *)
(* If no existing records are found, return incomingTokensAmt *)
(* else, return incomingTokenAmt + existing value *)
let computePendingReturnsVal =
  fun ( pendingReturns : Map (ByStr20) (Map ByStr20 Uint128) ) =>
  fun ( incomingTokensAmt : Uint128 ) =>
  fun ( incomingTokenAddr: ByStr20 ) =>
  fun ( recipientAddr: ByStr20 ) =>
    let zero = Uint128 0 in
    let map1  = builtin get pendingReturns recipientAddr in
    match map1 with
    | Some v =>
      let prevVal = builtin get v incomingTokenAddr in
      match prevVal with
      | None => incomingTokensAmt
      | Some value =>
        builtin add value incomingTokensAmt
      end
    | None => incomingTokensAmt
    end

let success = "Success"
let error = "Error"

(***************************************************)
(*             The contract definition             *)
(***************************************************)

contract SimpleDex
(contractOwner: ByStr20)

field contractAddress: Option ByStr20 = None {ByStr20}

(* Orderbook: mapping (orderIds => ( (tokenA, valueA) (tokenB, valueB) )) *)
(* @param: tokenA: Contract address of token A *)
(* @param: valueA: total units of token A offered by maker *)
(* @param: tokenB: Contract address of token B *)
(* @param: valueB: total units of token B requsted by maker *)
field orderbook : Map ByStr32 ( Pair ( Pair (ByStr20) (Uint128)) ( Pair (ByStr20) (Uint128)))
                  = Emp ByStr32 ( Pair( Pair (ByStr20) (Uint128)) ( Pair (ByStr20) (Uint128)))

(* Order info stores the mapping ( orderId => (tokenOwnerAddress, expirationBlock)) *)
field orderInfo : Map ByStr32 (Pair (ByStr20)(BNum)) = Emp ByStr32 (Pair (ByStr20) (BNum))

(* Ledger of how much the _sender can claim from the contract *)
(* mapping ( walletAddress => mapping (tokenContracts => amount) ) *)
field pendingReturns : Map ByStr20 (Map ByStr20 Uint128) = Emp ByStr20 (Map ByStr20 Uint128)

(* Maker creates an order to exchange valueA of tokenA for valueB of tokenB *)
transition makeOrder(tokenA: ByStr20, valueA: Uint128, tokenB: ByStr20, valueB: Uint128, expirationBlock: BNum)
  currentBlock <- & BLOCKNUMBER;
  validExpirationBlock =  let minBlocksFromCreation = Uint128 50 in
                          let minExpiration = builtin badd currentBlock minBlocksFromCreation in
                          builtin blt minExpiration expirationBlock;
  match validExpirationBlock with
  | True =>
    getContractAddress <- contractAddress;
    match getContractAddress with
    | Some cAddress =>
      (* Creates a new order *)
      newOrder = createOrder tokenA tokenB valueA valueB;
      orderId = createOrderId tokenA tokenB valueA valueB expirationBlock;
      orderbook[orderId] := newOrder;

      (* Updates orderInfo with maker's address and expiration blocknumber *)
      p = Pair {(ByStr20) (BNum)} _sender expirationBlock; 
      orderInfo[orderId] := p;

      e = {_eventname: "Order Created"; hash: orderId };
      event e;

      (* Transfer tokens from _sender to the contract address  *)
      msgs = let tag = "TransferFrom" in 
             let zero = Uint128 0 in
             transaction_msg_as_list tokenA tag _sender cAddress valueA;
      send msgs
    | None =>
      (* contract address not found *)
      e = let func = "makeOrder" in
          let error_msg = "Contract address not initialized" in 
          make_event error func error_msg;
      event e
    end

  | False =>
    e = let func = "makeOrder" in
        let error_msg = "Expiration block must be at least 50 blocks more than current block" in 
        make_event error func error_msg;
    event e
  end
end


(* Taker fills an order *)
transition fillOrder(orderId: ByStr32)
  getContractAddress <- contractAddress;
  match getContractAddress with
  | Some cAddress =>
    getOrder <- orderbook[orderId];
    match getOrder with
    | Some order =>
      (* Check the expiration block *)
      optionOrderInfo <- orderInfo[orderId];
      match optionOrderInfo with
      | Some info =>
        currentBlock <- & BLOCKNUMBER;
        blockBeforeExpiration = let getBNum = @snd (ByStr20) (BNum) in
                                let expirationBlock = getBNum info in
                                builtin blt currentBlock expirationBlock;
        match blockBeforeExpiration with
        | True =>
          bids = fst_pair order;
          asks = snd_pair order;
          tokenA = getAddressFromPair bids;
          valueA = getValueFromPair bids;
          tokenB = getAddressFromPair asks;
          valueB = getValueFromPair asks;
          makerAddr = let getMakerAddr = @fst (ByStr20)(BNum) in
                      getMakerAddr info; 
          (* Updates taker with the tokens that he is entitled to claim *)
          pr <- pendingReturns;
          takerAmt = computePendingReturnsVal pr valueA tokenA _sender;
          pendingReturns[_sender][tokenA] := takerAmt;

          pr2 <- pendingReturns;
          makerAmt = computePendingReturnsVal pr2 valueB tokenB makerAddr ;
          pendingReturns[makerAddr][tokenB] := makerAmt;
          
          (* Delete orders from the orderbook and orderinfo *)
          delete orderInfo[orderId];
          delete orderbook[orderId];

          e = {_eventname: "Order Filled"; hash: orderId };
          event e;
          (* Transfer tokens from _sender to the contract address  *)
          msgs = let tag = "TransferFrom" in 
                 transaction_msg_as_list tokenB tag _sender cAddress valueB;
          send msgs
        | False =>
          e = let func = "fillOrder" in
              let error_msg = "Current block number exceeds the expiration block set" in 
              make_event error func error_msg;
          event e
        end
      | None => 
        e = let func = "fillOrder" in
            let error_msg = "OrderId not found" in 
            make_event error func error_msg;
        event e
      end
    | None =>
      e = let func = "fillOrder" in
          let error_msg = "OrderId not found" in 
          make_event error func error_msg;
      event e
    end
  | None =>
      (* contract address not found *)
      e = let func = "makeOrder" in
          let error_msg = "Contract address not initialized" in 
          make_event error func error_msg;
      event e
  end
end


(* Allows users to claim back their tokens from the smart contract *)
transition ClaimBack(token: ByStr20)
  getCurrentAddress <- contractAddress;
  match getCurrentAddress with
  | Some cAddress =>
    getAmtOutstanding <- pendingReturns[_sender][token];
    match getAmtOutstanding with
    | Some amtOutstanding =>
        delete pendingReturns[_sender][token];
        e = {_eventname: "Claimback Successful"; caller: _sender; tokenAddr: token; amt: amtOutstanding };
        event e;
        (* Transfer tokens from _sender to the contract address  *)
        msgs = let tag = "TransferFrom" in 
               transaction_msg_as_list token tag cAddress _sender amtOutstanding;
        send msgs
    | None =>
        e = let func = "claimBack" in
            let error_msg = "No Pending Returns for Sender and Contract Address found" in 
            make_event error func error_msg;
        event e
    end
  | None =>
    
  end
end


(* Maker can cancel his order *)
transition cancelOrder(orderId: ByStr32)
  getOrderInfo <- orderInfo[orderId];
  match getOrderInfo with
  | Some orderInfo => 
      makerAddr = let getMakerAddr = @fst (ByStr20)(BNum) in
                  getMakerAddr orderInfo;
      checkSender = builtin eq makerAddr _sender;
      match checkSender with
      | True =>
        (* Sender is the maker, proceed with cancellation *)
        fetchOrder <- orderbook[orderId];
        match fetchOrder with
        | Some order =>
          bids = fst_pair order;
          tokenA = getAddressFromPair bids;
          valueA = getValueFromPair bids;

          (* Updates taker with the tokens that he is entitled to claim *)
          pr <- pendingReturns;
          takerAmt = computePendingReturnsVal pr valueA tokenA _sender;
          pendingReturns[_sender][tokenA] := takerAmt;
          
          (* Delete orders from the orderbook and orderinfo *)
          delete orderInfo[orderId];
          delete orderbook[orderId];

          e = {_eventname: "Cancel order successful"; hash: orderId };
          event e
          (* @note: For consistency, we use claimback instead of sending the tokens  *)
          (* back to the maker *)
        | None =>
          e = let func = "cancelOrder" in
              let error_msg = "OrderID not found" in 
              make_event error func error_msg;
          event e
        end

      | False =>
        (* Unauthorized transaction *)
        e = let func = "cancelOrder" in
            let error_msg = "Sender is not maker of the order" in 
            make_event error func error_msg;
        event e
      end
  | None =>
      (* Order ID not found *)
      e = let func = "cancelOrder" in
          let error_msg = "OrderID not found" in 
          make_event error func error_msg;
      event e
  end
end

(* Only contract owner can update the contract address *)
transition updateContractAddress(address: ByStr20)
  isOwner = builtin eq contractOwner _sender;
  match isOwner with
  | False =>
    (* Not contract owner *)
    e = let func = "updateContractAddress" in
        let error_msg = "Unauthorized" in 
        make_event error func error_msg;
    event e
  | True =>
    (* Updates the contract address *)
    currentAddress <- contractAddress;
    match currentAddress with
    | None =>
      addr = Some {ByStr20} address;
      contractAddress := addr;
      e = let func = "updateContractAddress" in
          let error_msg = "Contract address updated" in 
          make_event success func error_msg;
      event e
    | Some v =>
      (* Contract address can only be updated once *)
      e = let func = "updateContractAddress" in
          let error_msg = "Contract address has already been initialized" in 
          make_event error func error_msg;
      event e
    end
  end
end`;
