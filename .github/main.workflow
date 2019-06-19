workflow "Build & deploy docs" {
  on = "push"
  resolves = ["Publish Documentation"]
}

action "Publish Docs (master branch only)" {
  uses = "actions/bin/filter@master"
  args = "branch master"
}

action "Install Dependencies" {
  uses = "actions/npm@master"
  runs = "yarn"
  args = "install"
  needs = ["Publish Docs (master branch only)"]
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
