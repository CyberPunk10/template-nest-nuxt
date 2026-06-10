import ruBase from './ru.json'
import enBase from './en.json'
import thBase from './th.json'
import ruAbout from './about/ru.json'
import enAbout from './about/en.json'
import thAbout from './about/th.json'
import ruProfile from './profile/ru.json'
import enProfile from './profile/en.json'
import thProfile from './profile/th.json'

export const ru = {
  ...ruBase,
  about: ruAbout,
  profile: ruProfile,
}
export const en = {
  ...enBase,
  about: enAbout,
  profile: enProfile,
}
export const th = {
  ...thBase,
  about: thAbout,
  profile: thProfile,
}
