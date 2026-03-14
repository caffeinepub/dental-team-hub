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
    public func compare(message1 : Message, message2 : Message) : Order.Order {
      Nat.compare(message1.id, message2.id);
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
    public func compare(privateMessage1 : PrivateMessage, privateMessage2 : PrivateMessage) : Order.Order {
      Nat.compare(privateMessage1.id, privateMessage2.id);
    };
  };

  type UserProfile = {
    name : Text;
    lastSeen : Time.Time;
  };

  module UserProfile {
    public func compare(profile1 : UserProfile, profile2 : UserProfile) : Order.Order {
      switch (Text.compare(profile1.name, profile2.name)) {
        case (#equal) { Int.compare(profile1.lastSeen, profile2.lastSeen) };
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
    public func compare(task1 : Task, task2 : Task) : Order.Order {
      Nat.compare(task1.id, task2.id);
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

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func updateLastSeen() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update last seen");
    };

    let existingProfile = userProfiles.get(caller);
    switch (existingProfile) {
      case (null) { Runtime.trap("Profile not found, must register first") };
      case (?profile) {
        userProfiles.add(
          caller,
          {
            name = profile.name;
            lastSeen = Time.now();
          },
        );
      };
    };
  };

  // Message Functions
  public shared ({ caller }) func addMessage(content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
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
      Runtime.trap("Unauthorized: Only users can access this endpoint");
    };
    messages.toArray().sort();
  };

  // Direct Message Functions
  public shared ({ caller }) func sendPrivateMessage(recipient : Principal, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send private messages");
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
      Runtime.trap("Unauthorized: Only users can access this endpoint");
    };
    privateMessages.toArray().filter(
      func(msg) {
        (msg.sender == caller and msg.recipient == partner)
        or (msg.sender == partner and msg.recipient == caller)
      }
    ).sort();
  };

  // Task Functions
  public shared ({ caller }) func createTask(title : Text, description : Text, assignee : Assignee, bucketId : ?Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create tasks");
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
      Runtime.trap("Unauthorized: Only users can update tasks");
    };

    let updatedTasks = tasks.toArray().map(
      func(task) {
        if (task.id == id) {
          {
            task with
            completed;
          };
        } else { task };
      }
    );
    tasks.clear();
    let updatedTasksIter = updatedTasks.values();
    for (task in updatedTasksIter) { tasks.add(task) };
  };

  public shared ({ caller }) func deleteTask(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete tasks");
    };

    let filteredTasks = tasks.toArray().filter(
      func(task) { task.id != id }
    );
    tasks.clear();
    let filteredTasksIter = filteredTasks.values();
    for (task in filteredTasksIter) { tasks.add(task) };
  };

  public query ({ caller }) func getTasks() : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access this endpoint");
    };
    tasks.toArray().sort();
  };

  // Bucket Functions
  public shared ({ caller }) func createBucket(name : Text, color : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create buckets");
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
      Runtime.trap("Unauthorized: Only users can access this endpoint");
    };
    buckets.toArray();
  };

  public shared ({ caller }) func deleteBucket(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete buckets");
    };

    let filteredBuckets = buckets.toArray().filter(
      func(bucket) { bucket.id != id }
    );
    buckets.clear();
    let filteredBucketsIter = filteredBuckets.values();
    for (bucket in filteredBucketsIter) { buckets.add(bucket) };
  };

  // Helper Methods
  func getProfileInternal(owner : Principal) : UserProfile {
    switch (userProfiles.get(owner)) {
      case (null) { Runtime.trap("This user does not exist ") };
      case (?profile) { profile };
    };
  };

  public query ({ caller }) func getUserProfiles() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access this endpoint");
    };
    userProfiles.values().toArray().sort();
  };

  // Invite System
  public shared ({ caller }) func createInvite() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create invites");
    };

    let allCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let charArray = allCharacters.toArray();
    let charArrayLength = charArray.size();
    let maxRandomIndex = (charArrayLength - 1 : Nat);

    func generateToken(attemptCounter : Nat) : Text {
      let randomIndex = Nat.min(attemptCounter, maxRandomIndex);
      let chars = Array.tabulate(
        8,
        func(i) {
          let index = ((Int.abs(Time.now()) + i + attemptCounter) % charArrayLength : Int).toNat();
          charArray[index];
        },
      );
      chars.toText();
    };

    var token : Text = "";
    var attemptCounter = 0;
    let maxAttempts = 200;

    while (token == "" and attemptCounter < maxAttempts) {
      token := generateToken(attemptCounter);
      attemptCounter += 1;
    };

    if (token == "") {
      Runtime.trap("Failed to generate invite token");
    } else {
      let invite : Invite = {
        token;
        status = #active;
        createdAt = Time.now();
      };
      invites.add(invite);
    };

    token;
  };

  public query ({ caller }) func getInvites() : async [Invite] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access invites");
    };
    invites.toArray();
  };

  public shared ({ caller }) func revokeInvite(token : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can revoke invites");
    };

    let updatedInvites = invites.toArray().map(
      func(invite) {
        if (invite.token == token) {
          {
            invite with
            status = #revoked;
          };
        } else { invite };
      }
    );
    invites.clear();
    let updatedInvitesIter = updatedInvites.values();
    for (invite in updatedInvitesIter) { invites.add(invite) };
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
            let updatedInvites = invites.toArray().map(
              func(i) {
                if (i.token == inviteToken) {
                  {
                    i with
                    status = #used;
                  };
                } else { i };
              }
            );
            invites.clear();
            let updatedInvitesIter = updatedInvites.values();
            for (invite in updatedInvitesIter) { invites.add(invite) };

            let profile : UserProfile = {
              name;
              lastSeen = Time.now();
            };
            userProfiles.add(caller, profile);

            AccessControl.assignRole(accessControlState, caller, caller, #user);
          };
          case (#used) { Runtime.trap("Invite has already been used") };
          case (#revoked) { Runtime.trap("Invite has been revoked") };
        };
      };
      case (null) { Runtime.trap("Invalid invite token") };
    };
  };
};
