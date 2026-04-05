import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import List "mo:core/List";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Int "mo:core/Int";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type PostId = Nat;
  type CommentId = Nat;

  module FullPost {
    public func compare(a : FullPost, b : FullPost) : Order.Order {
      Nat.compare(b.createdAt, a.createdAt);
    };
  };

  module Comment {
    public func compare(a : Comment, b : Comment) : Order.Order {
      Nat.compare(b.createdAt, a.createdAt);
    };
  };

  // Access Control Integration
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // Post Types
  type Mood = {
    #happy;
    #sad;
    #stress;
    #love;
    #angry;
    #anxious;
    #hopeful;
  };

  type Reaction = {
    #support;
    #meToo;
  };

  type Post = {
    author : Principal;
    mood : Mood;
    content : Text;
    createdAt : Nat;
  };

  type Comment = {
    postId : PostId;
    author : Principal;
    content : Text;
    createdAt : Nat;
  };

  type ReactionMap = {
    supportReactions : Map.Map<PostId, List.List<Principal>>;
    meTooReactions : Map.Map<PostId, List.List<Principal>>;
  };

  let posts = Map.empty<PostId, Post>();
  let comments = Map.empty<CommentId, Comment>();
  var postIdCounter = 0;
  var commentIdCounter = 0;
  let reactions : ReactionMap = {
    supportReactions = Map.empty<PostId, List.List<Principal>>();
    meTooReactions = Map.empty<PostId, List.List<Principal>>();
  };

  // Helper Functions
  func nextPostId() : PostId {
    let id = postIdCounter;
    postIdCounter += 1;
    id;
  };

  func nextCommentId() : CommentId {
    let id = commentIdCounter;
    commentIdCounter += 1;
    id;
  };

  func getOrCreateReactionList(reactionType : Reaction, postId : PostId) : List.List<Principal> {
    switch (reactionType) {
      case (#support) {
        switch (reactions.supportReactions.get(postId)) {
          case (null) { List.empty<Principal>() };
          case (?list) { list };
        };
      };
      case (#meToo) {
        switch (reactions.meTooReactions.get(postId)) {
          case (null) { List.empty<Principal>() };
          case (?list) { list };
        };
      };
    };
  };

  // User Profile API Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Post API Functions (No authorization needed - anonymous posts allowed)
  public shared ({ caller }) func createPost(mood : Mood, content : Text) : async PostId {
    let postId = nextPostId();
    let post : Post = {
      author = caller;
      mood;
      content;
      createdAt = Int.abs(Time.now());
    };
    posts.add(postId, post);
    postId;
  };

  type FullPost = {
    id : PostId;
    author : Principal;
    mood : Mood;
    content : Text;
    createdAt : Nat;
    supportCount : Nat;
    meTooCount : Nat;
    commentCount : Nat;
  };

  public query ({ caller }) func getAllPosts() : async [FullPost] {
    posts.entries().toArray().map(
      func((postId, post)) {
        {
          id = postId;
          author = post.author;
          mood = post.mood;
          content = post.content;
          createdAt = post.createdAt;
          supportCount = switch (reactions.supportReactions.get(postId)) {
            case (null) { 0 };
            case (?list) { list.size() };
          };
          meTooCount = switch (reactions.meTooReactions.get(postId)) {
            case (null) { 0 };
            case (?list) { list.size() };
          };
          commentCount = comments.values().toArray().filter(func(comment) { comment.postId == postId }).size();
        };
      }
    ).sort().values().toArray();
  };

  public shared ({ caller }) func reactToPost(postId : PostId, reaction : Reaction) : async () {
    if (not posts.containsKey(postId)) { Runtime.trap("Post does not exist") };
    let currentReactions = getOrCreateReactionList(reaction, postId);
    if (currentReactions.contains(caller)) {
      Runtime.trap("User already reacted to this post");
    };
    currentReactions.add(caller);
    switch (reaction) {
      case (#support) {
        reactions.supportReactions.add(postId, currentReactions);
      };
      case (#meToo) {
        reactions.meTooReactions.add(postId, currentReactions);
      };
    };
  };

  public shared ({ caller }) func addComment(postId : PostId, content : Text) : async CommentId {
    if (not posts.containsKey(postId)) { Runtime.trap("Post does not exist") };
    let commentId = nextCommentId();
    let comment : Comment = {
      postId;
      author = caller;
      content;
      createdAt = Int.abs(Time.now());
    };
    comments.add(commentId, comment);
    commentId;
  };

  public query ({ caller }) func getComments(postId : PostId) : async [Comment] {
    comments.values().toArray().filter(func(comment) { comment.postId == postId }).sort().values().toArray();
  };
};
