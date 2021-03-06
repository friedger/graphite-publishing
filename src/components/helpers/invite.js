import {
  getFile,
  loadUserData,
  putFile
} from 'blockstack'
import { setGlobal, getGlobal } from 'reactn';
import axios from 'axios';
const { encryptECIES } = require('blockstack/lib/encryption');
const { getPublicKeyFromPrivate } = require('blockstack');

export function loadInviteStatus() {
  console.log("Checking invite status");
    getFile('inviteStatus.json', {decrypt: true})
      .then((fileContents) => {
        if(fileContents) {
          setGlobal({
            inviteAccepted: JSON.parse(fileContents || '{}').inviteAccepted,
            accountName: JSON.parse(fileContents || '{}').accountName,
            inviter: JSON.parse(fileContents || '{}').inviter,
            ownerEmail: JSON.parse(fileContents || '{}').ownerEmail,
            onboardingComplete: true //need to programatically set this
          })
        } else {
          setGlobal({
            inviteAccepted: false,
            accountName: "",
            inviter: ""
          })
        }
      })
      .then(() => {
        if(getGlobal().inviteAccepted === false) {
          this.loadInvite();
        } else {
          if(getGlobal().inviter !== "" && getGlobal().inviter !== undefined){
            console.log(getGlobal().inviter);
            this.loadBasicInviteInfo();
          } else {
            this.setLoadedFile();
          }
        }
      })
      .catch(error => {
        console.log(error);
      })
}

export function loadInvite() {
  let mainLink = window.location.href;
  let userToLoadFrom = mainLink.split('?')[1];
  let fileRoot = mainLink.split('?')[2];
  const options = { username: userToLoadFrom, zoneFileLookupURL: "https://core.blockstack.org/v1/names", decrypt: false}
  getFile(fileRoot + '.json', options)
    .then((fileContents) => {
      console.log(JSON.parse(fileContents || '{}'))
      setGlobal({
        inviterKey: JSON.parse(fileContents || '{}').inviterKey,
        inviteDate: JSON.parse(fileContents || '{}').inviteDate,
        inviter: JSON.parse(fileContents || '{}').inviter,
        accountName: JSON.parse(fileContents || '{}').accountName,
        inviteeEmail: JSON.parse(fileContents || '{}').inviteeEmail,
        inviteeBlockstackId: loadUserData().username,
        inviteeName: JSON.parse(fileContents || '{}').inviteeName,
        inviteeRole: JSON.parse(fileContents || '{}').inviteeRole,
        inviteeId: JSON.parse(fileContents || '{}').inviteeId,
        inviteeKey: getPublicKeyFromPrivate(loadUserData().appPrivateKey),
        inviterEmail: JSON.parse(fileContents || '{}').inviterEmail,
        inviteAccepted: JSON.parse(fileContents || '{}').inviteAccepted,
      })
    })
    .then(() => {
      this.saveBasicInviteInfo();
    })
    .catch(error => {
      console.log(error);
    })
}

export function saveBasicInviteInfo() {
  putFile('inviter.json', JSON.stringify(getGlobal().inviter), {encrypt: true})
    .catch(error => {
      console.log(error);
    })
}

export function inviteInfo() {
  getFile('inviter.json', {decrypt: true})
    .then((fileContents) => {
      if(fileContents) {
        setGlobal({ inviter: JSON.parse(fileContents || '{}')});
        setTimeout(this.loadBasicInviteInfo, 300)
      } else {
        this.setLoadedFile();
      }

    })
    .catch(error => {
      console.log(error);
    })
}

export function acceptInvite() {
  setGlobal({ loading: true });
  const object = {};
  object.inviteAccepted = true;
  object.accountName = getGlobal().accountName;
  object.inviteDate = getGlobal().inviteDate;
  object.inviter = getGlobal().inviter;
  object.inviteeEmail = getGlobal().inviteeEmail;
  object.inviteeBlockstackId = loadUserData().username;
  object.inviteeName = getGlobal().inviteeName;
  object.inviteeRole = getGlobal().inviteeRole;
  object.inviteeId = getGlobal().inviteeId;
  object.inviteeKey = getPublicKeyFromPrivate(loadUserData().appPrivateKey);
  object.onboardingComplete = true;
  setGlobal({ inviteDetails: object });
  putFile('inviteStatus.json', JSON.stringify(object), {encrypt: true})
    .then(() => {
      this.saveToInviter();
    })
    .catch(error => {
      console.log(error);
    })
}

export function saveToInviter() {
  let publicKey = getGlobal().inviterKey;
  const encryptedData = JSON.stringify(encryptECIES(publicKey, JSON.stringify(getGlobal().inviteDetails)));
  console.log(getGlobal().inviteeId + '/inviteaccepted.json');
  if(getGlobal().inviterKey !== "" || getGlobal().inviterKey !== undefined) {
    putFile(getGlobal().inviteeId + '/inviteaccepted.json', encryptedData, {encrypt: false})
      .then(() => {
        this.sendToInviter();
      })
      .catch(error => {
        console.log(error);
      })
  } else {
    window.M.toast({html: 'Error with inviter public key'});
  }
}

export function sendToInviter() {
  let id = getGlobal().inviteeId;
  let acceptanceLink = 'https://publishing.graphitedocs.com/acceptances/?' + loadUserData().username + '?' + id;
  const object = {};
  object.from_email = "contact@graphitedocs.com";
  object.to_email = getGlobal().inviterEmail;
  object.subject = loadUserData().username + ' has accepted your invite';
  object.content = "<div style='text-align:center;'><div style='background:#282828;width:100%;height:auto;margin-bottom:40px;'><h3 style='color:#ffffff;'>" + getGlobal().accountName + "</h3></div><h3>Your invite to " + loadUserData().username + " has been accepted!</h3><p>Confirm the acceptance by clicking the below link:</p><p><a href=" + acceptanceLink + ">" + acceptanceLink + "</a></p></div>"
  setGlobal({ sendToInviter: object });
  setTimeout(this.sendAcceptEmail, 300);
}

export function sendAcceptEmail() {
  axios.post("https://wt-3fc6875d06541ef8d0e9ab2dfcf85d23-0.sandbox.auth0-extend.com/accept-invite", getGlobal().sendToInviter)
    .then(function (response) {
      console.log(response);
      window.location.replace('/posts');
    })
    .catch(function (error) {
      console.log(error);
    });
}
