import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  Table,
  Unique,
  Validate,
} from 'sequelize-typescript';

enum UserType {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Table
class User extends Model<User> {
  @AllowNull(false)
  @Column
  name: string;

  @Unique
  @Validate({
    isEmail: {
      msg: 'Email field must have email format',
    },
  })
  @Column
  email: string;

  @Validate({
    isIn: {
      args: [Object.values(UserType)],
      msg: 'Invalid user type specified. Must be ADMIN or USER',
    },
  })
  @AllowNull(false)
  @Default(UserType.USER)
  @Column(DataType.STRING)
  role: UserType;

  @Unique
  @Column
  auth0Id: string;

  @Validate({
    isIn: [['SG', 'BD', '']],
  })
  @Column
  destinationCountry: string;

  @Column
  createdAt: string;
}

export default User;
export { UserType };
