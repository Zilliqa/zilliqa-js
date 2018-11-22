export const testContract = `(* Test contract *)

import ListUtils

(***************************************************)
(*               Associated library                *)
(***************************************************)
library HelloWorld

let one_msg = 
  fun (msg : Message) => 
  let nil_msg = Nil {Message} in
  Cons {Message} msg nil_msg

let set_hello_code = Int32 2

(***************************************************)
(*             The contract definition             *)
(***************************************************)

contract HelloWorld
(owner: ByStr20)

field welcome_msg : String = ""

transition setHello (msg : String)
  welcome_msg := msg;
  msg = {_tag : "Main"; _recipient : _sender; _amount : Uint128 0; code : set_hello_code};
  msgs = one_msg msg;
  send msgs
end

transition getHello ()
    r <- welcome_msg;
    msg = {_tag : "Main"; _recipient : _sender; _amount : Uint128 0; msg : r};
    msgs = one_msg msg;
    send msgs
end`;
