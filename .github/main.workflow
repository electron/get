workflow "Build & deploy docs" {
  on = "push"
  resolves = ["Publish Documentation"]
}

action "Only Master" {
  uses = "actions/bin/filter@master"
  args = "branch master"
}

action "Install Dependencies" {
  uses = "actions/npm@master"
  needs = ["Only Master"]
  runs = "yarn"
  args = "install"
}

action "Build Documentation" {
  uses = "actions/npm@master"
  needs = ["Install Dependencies"]
  runs = "yarn"
  args = "build:docs"
}

action "Publish Documentation" {
  uses = "actions/npm@master"
  needs = ["Build Documentation"]
  runs = "yarn"
  args = "publish:docs"
  secrets = ["GITHUB_TOKEN"]
}
