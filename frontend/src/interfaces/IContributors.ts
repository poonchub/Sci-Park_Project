import { ContributorTypeInterface } from "./IContributorTypes"

export interface ContributorInterface {
    Name?:          string
	Email?:         string
	GithubUrl?:     string
	FacebookUrl?:   string
	Phone?:         string
	ProfilePath?:   string
	Role?:          string
	Bio?:			string

	ContributorTypeID?:	number
	ContributorType?:	ContributorTypeInterface
}