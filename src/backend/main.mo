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

// Specify the data migration function in with-clause

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

  type CompanyEntryCategory = {
    #labs;
    #dental_supply;
    #insurance;
  };

  type CompanyEntry = {
    id : Nat;
    name : Text;
    category : CompanyEntryCategory;
    website_url : Text;
    username : Text;
    password : Text;
  };

  type ResourceCategory = {
    id : Nat;
    name : Text;
  };

  type ResourceEntry = {
    id : Nat;
    categoryId : Nat;
    name : Text;
    url : Text;
    username : Text;
    password : Text;
  };

  let messages = List.empty<Message>();
  var nextId = 0;
  let tasks = List.empty<Task>();
  let privateMessages = List.empty<PrivateMessage>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let invites = List.empty<Invite>();
  let buckets = List.empty<Bucket>();
  var nextBucketId = 0;
  var nextCompanyEntryId = 0;
  var companyEntries = List.empty<CompanyEntry>();
  var nextResourceCategoryId = 0;
  var nextResourceEntryId = 0;
  var resourceCategories = List.empty<ResourceCategory>();
  var resourceEntries = List.empty<ResourceEntry>();

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
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
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

  func canModifyTask(caller : Principal, task : Task) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    if (task.creator == caller) {
      return true;
    };
    if (task.assignee.principal == caller) {
      return true;
    };
    false;
  };

  public shared ({ caller }) func editTask(id : Nat, title : Text, description : Text, bucketId : ?Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let taskOpt = tasks.toArray().find(func(task) { task.id == id });
    switch (taskOpt) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (not canModifyTask(caller, task)) {
          Runtime.trap("Unauthorized: You can only edit tasks you created or are assigned to");
        };
      };
    };
    let updated = tasks.toArray().map(
      func(task) {
        if (task.id == id) {
          { task with title; description; bucketId };
        } else { task };
      }
    );
    tasks.clear();
    for (t in updated.values()) { tasks.add(t) };
  };

  public shared ({ caller }) func updateTask(id : Nat, completed : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let taskOpt = tasks.toArray().find(func(task) { task.id == id });
    switch (taskOpt) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (not canModifyTask(caller, task)) {
          Runtime.trap("Unauthorized: You can only update tasks you created or are assigned to");
        };
      };
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
    let taskOpt = tasks.toArray().find(func(task) { task.id == id });
    switch (taskOpt) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (not canModifyTask(caller, task)) {
          Runtime.trap("Unauthorized: You can only delete tasks you created or are assigned to");
        };
      };
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
    let digits = "0123456789";
    let digitArray = digits.toArray();
    let seed = Int.abs(Time.now());
    let pin = Array.tabulate(6, func(i) { digitArray[(seed / (10 ** i) % 10 : Int).toNat()] });
    let token = pin.toText();
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

  // CompanyEntry CRUD (Admin Only)
  public shared ({ caller }) func addCompanyEntry(name : Text, category : CompanyEntryCategory, website_url : Text, username : Text, password : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add company entries");
    };
    let entry : CompanyEntry = {
      id = nextCompanyEntryId;
      name;
      category;
      website_url;
      username;
      password;
    };
    nextCompanyEntryId += 1;
    companyEntries.add(entry);
  };

  public shared ({ caller }) func editCompanyEntry(id : Nat, name : Text, website_url : Text, username : Text, password : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can edit company entries");
    };
    let updated = companyEntries.toArray().map(
      func(entry) {
        if (entry.id == id) {
          { entry with name; website_url; username; password };
        } else { entry };
      }
    );
    companyEntries := List.fromArray(updated);
  };

  public shared ({ caller }) func deleteCompanyEntry(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete company entries");
    };
    let filtered = companyEntries.toArray().filter(func(entry) { entry.id != id });
    companyEntries := List.fromArray(filtered);
  };

  public query ({ caller }) func getCompanyEntries() : async [CompanyEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view company entries");
    };
    companyEntries.toArray();
  };

  // Resource Category and Entry Functions
  public shared ({ caller }) func createResourceCategory(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Only admins can create resource categories");
    };
    let category : ResourceCategory = {
      id = nextResourceCategoryId;
      name;
    };
    resourceCategories.add(category);
    nextResourceCategoryId += 1;
  };

  public shared ({ caller }) func deleteResourceCategory(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Only admins can delete resource categories");
    };
    let filteredCategories = resourceCategories.toArray().filter(func(cat) { cat.id != id });
    resourceCategories := List.fromArray(filteredCategories);

    let filteredEntries = resourceEntries.toArray().filter(func(entry) { entry.categoryId != id });
    resourceEntries := List.fromArray(filteredEntries);
  };

  public shared ({ caller }) func renameResourceCategory(id : Nat, newName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Only admins can rename resource categories");
    };
    let updated = resourceCategories.toArray().map(
      func(cat) {
        if (cat.id == id) { { cat with name = newName } } else { cat };
      }
    );
    resourceCategories.clear();
    for (cat in updated.values()) { resourceCategories.add(cat) };
  };

  public shared ({ caller }) func addResourceEntry(categoryId : Nat, name : Text, url : Text, username : Text, password : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Only admins can add resources");
    };
    switch (resourceCategories.toArray().find(func(cat) { cat.id == categoryId })) {
      case (null) { Runtime.trap("Category does not exist") };
      case (?_) {};
    };
    let entry : ResourceEntry = {
      id = nextResourceEntryId;
      categoryId;
      name;
      url;
      username;
      password;
    };
    resourceEntries.add(entry);
    nextResourceEntryId += 1;
  };

  public shared ({ caller }) func deleteResourceEntry(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Only admins can delete resources");
    };
    let filtered = resourceEntries.toArray().filter(func(entry) { entry.id != id });
    resourceEntries := List.fromArray(filtered);
  };

  public shared ({ caller }) func editResourceEntry(id : Nat, name : Text, url : Text, username : Text, password : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Only admins can update resources");
    };
    let updated = resourceEntries.toArray().map(
      func(entry) {
        if (entry.id == id) {
          { entry with name; url; username; password };
        } else { entry };
      }
    );
    resourceEntries.clear();
    for (entry in updated.values()) { resourceEntries.add(entry) };
  };

  public shared ({ caller }) func moveTaskToResourceCategory(taskId : Nat, resourceCategoryId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Only authenticated users can move tasks");
    };
    switch (resourceCategories.toArray().find(func(cat) { cat.id == resourceCategoryId })) {
      case (null) { Runtime.trap("Resource category does not exist") };
      case (?_) {};
    };
    switch (tasks.toArray().find(func(task) { task.id == taskId })) {
      case (null) { Runtime.trap("Task does not exist") };
      case (?task) {
        if (not canModifyTask(caller, task)) {
          Runtime.trap("Cannot move tasks you don't own");
        };
        let taskUpdates = tasks.toArray().map(
          func(t) {
            if (t.id == taskId) { { t with completed = true } } else { t };
          }
        );
        tasks.clear();
        for (t in taskUpdates.values()) { tasks.add(t) };
      };
    };
  };

  public shared ({ caller }) func toggleTaskCompleted(taskId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Only authenticated users can update tasks");
    };
    switch (tasks.toArray().find(func(task) { task.id == taskId })) {
      case (null) { Runtime.trap("Task does not exist") };
      case (?task) {
        if (not canModifyTask(caller, task)) {
          Runtime.trap("Cannot modify tasks you don't own");
        };
        let updated = tasks.toArray().map(
          func(t) {
            if (t.id == taskId) { { t with completed = not t.completed } } else { t };
          }
        );
        tasks.clear();
        for (t in updated.values()) { tasks.add(t) };
      };
    };
  };

  public query ({ caller }) func getResourceCategories() : async [ResourceCategory] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Only authenticated users can view resource categories");
    };
    resourceCategories.toArray();
  };

  public query ({ caller }) func getResourceEntries() : async [ResourceEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Only authenticated users can view resources");
    };
    resourceEntries.toArray();
  };
};
