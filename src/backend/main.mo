import Int "mo:core/Int";
import List "mo:core/List";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type Assignee = {
    principal : Principal;
    name : Text;
  };

  type Message = {
    id : Nat;
    sender : Principal;
    senderName : Text;
    content : Text;
    timestamp : Time.Time;
  };

  module Message {
    public func compare(m1 : Message, m2 : Message) : Order.Order {
      Nat.compare(m1.id, m2.id);
    };
  };

  type PrivateMessage = {
    id : Nat;
    sender : Principal;
    recipient : Principal;
    content : Text;
    timestamp : Time.Time;
  };

  module PrivateMessage {
    public func compare(m1 : PrivateMessage, m2 : PrivateMessage) : Order.Order {
      Nat.compare(m1.id, m2.id);
    };
  };

  type UserProfile = {
    name : Text;
    lastSeen : Time.Time;
  };

  module UserProfile {
    public func compare(p1 : UserProfile, p2 : UserProfile) : Order.Order {
      switch (Text.compare(p1.name, p2.name)) {
        case (#equal) { Int.compare(p1.lastSeen, p2.lastSeen) };
        case (order) { order };
      };
    };
  };

  type Task = {
    id : Nat;
    title : Text;
    description : Text;
    creator : Principal;
    assignee : Assignee;
    completed : Bool;
    timestamp : Time.Time;
    bucketId : ?Nat;
  };

  module Task {
    public func compare(t1 : Task, t2 : Task) : Order.Order {
      Nat.compare(t1.id, t2.id);
    };
  };

  type Bucket = {
    id : Nat;
    name : Text;
    color : Text;
    createdAt : Time.Time;
  };

  type InviteStatus = {
    #active;
    #used;
    #revoked;
  };

  type Invite = {
    token : Text;
    status : InviteStatus;
    createdAt : Time.Time;
  };

  let messages = List.empty<Message>();
  var nextId = 0;
  let tasks = List.empty<Task>();
  let privateMessages = List.empty<PrivateMessage>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let invites = List.empty<Invite>();
  let buckets = List.empty<Bucket>();
  var nextBucketId = 0;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func updateLastSeen() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let existingProfile = userProfiles.get(caller);
    switch (existingProfile) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        userProfiles.add(caller, { name = profile.name; lastSeen = Time.now() });
      };
    };
  };

  public shared ({ caller }) func addMessage(content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let profile = getProfileInternal(caller);
    let message : Message = {
      id = nextId;
      sender = caller;
      senderName = profile.name;
      content;
      timestamp = Time.now();
    };
    messages.add(message);
    nextId += 1;
  };

  public query ({ caller }) func getMessages() : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    messages.toArray().sort();
  };

  public shared ({ caller }) func sendPrivateMessage(recipient : Principal, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let privateMessage : PrivateMessage = {
      id = nextId;
      sender = caller;
      recipient;
      content;
      timestamp = Time.now();
    };
    privateMessages.add(privateMessage);
    nextId += 1;
  };

  public query ({ caller }) func getDirectMessagesWith(partner : Principal) : async [PrivateMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    privateMessages.toArray().filter(
      func(msg) {
        (msg.sender == caller and msg.recipient == partner)
        or (msg.sender == partner and msg.recipient == caller)
      }
    ).sort();
  };

  public shared ({ caller }) func createTask(title : Text, description : Text, assignee : Assignee, bucketId : ?Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let task : Task = {
      id = nextId;
      title;
      description;
      creator = caller;
      assignee;
      completed = false;
      timestamp = Time.now();
      bucketId;
    };
    tasks.add(task);
    nextId += 1;
  };

  public shared ({ caller }) func updateTask(id : Nat, completed : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let updated = tasks.toArray().map(
      func(task) {
        if (task.id == id) { { task with completed } } else { task };
      }
    );
    tasks.clear();
    for (t in updated.values()) { tasks.add(t) };
  };

  public shared ({ caller }) func deleteTask(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let filtered = tasks.toArray().filter(func(task) { task.id != id });
    tasks.clear();
    for (t in filtered.values()) { tasks.add(t) };
  };

  public query ({ caller }) func getTasks() : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    tasks.toArray().sort();
  };

  // Bucket Functions — admin-only for create/rename/delete
  public shared ({ caller }) func createBucket(name : Text, color : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create buckets");
    };
    let bucket : Bucket = {
      id = nextBucketId;
      name;
      color;
      createdAt = Time.now();
    };
    buckets.add(bucket);
    nextBucketId += 1;
  };

  public query ({ caller }) func getBuckets() : async [Bucket] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    buckets.toArray();
  };

  public shared ({ caller }) func renameBucket(id : Nat, newName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can rename buckets");
    };
    let updated = buckets.toArray().map(
      func(bucket) {
        if (bucket.id == id) { { bucket with name = newName } } else { bucket };
      }
    );
    buckets.clear();
    for (b in updated.values()) { buckets.add(b) };
  };

  public shared ({ caller }) func deleteBucket(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete buckets");
    };
    let filtered = buckets.toArray().filter(func(bucket) { bucket.id != id });
    buckets.clear();
    for (b in filtered.values()) { buckets.add(b) };
  };

  func getProfileInternal(owner : Principal) : UserProfile {
    switch (userProfiles.get(owner)) {
      case (null) { Runtime.trap("User does not exist") };
      case (?profile) { profile };
    };
  };

  public query ({ caller }) func getUserProfiles() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.values().toArray().sort();
  };

  public shared ({ caller }) func createInvite() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create invites");
    };
    let allCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let charArray = allCharacters.toArray();
    let charArrayLength = charArray.size();
    func generateToken(attempt : Nat) : Text {
      let chars = Array.tabulate(
        8,
        func(i) {
          let index = ((Int.abs(Time.now()) + i + attempt) % charArrayLength : Int).toNat();
          charArray[index];
        },
      );
      chars.toText();
    };
    var token : Text = "";
    var attempt = 0;
    while (token == "" and attempt < 200) {
      token := generateToken(attempt);
      attempt += 1;
    };
    if (token == "") { Runtime.trap("Failed to generate token") };
    let invite : Invite = { token; status = #active; createdAt = Time.now() };
    invites.add(invite);
    token;
  };

  public query ({ caller }) func getInvites() : async [Invite] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    invites.toArray();
  };

  public shared ({ caller }) func revokeInvite(token : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let updated = invites.toArray().map(
      func(invite) {
        if (invite.token == token) { { invite with status = #revoked } } else { invite };
      }
    );
    invites.clear();
    for (i in updated.values()) { invites.add(i) };
  };

  public shared ({ caller }) func register(name : Text, inviteToken : Text) : async () {
    switch (userProfiles.get(caller)) {
      case (?_) { Runtime.trap("User already registered") };
      case (null) {};
    };
    let inviteOpt = invites.toArray().find(func(invite) { invite.token == inviteToken });
    switch (inviteOpt) {
      case (?invite) {
        switch (invite.status) {
          case (#active) {
            let updated = invites.toArray().map(
              func(i) {
                if (i.token == inviteToken) { { i with status = #used } } else { i };
              }
            );
            invites.clear();
            for (i in updated.values()) { invites.add(i) };
            userProfiles.add(caller, { name; lastSeen = Time.now() });
            AccessControl.assignRole(accessControlState, caller, caller, #user);
          };
          case (#used) { Runtime.trap("Invite already used") };
          case (#revoked) { Runtime.trap("Invite revoked") };
        };
      };
      case (null) { Runtime.trap("Invalid invite token") };
    };
  };
};
