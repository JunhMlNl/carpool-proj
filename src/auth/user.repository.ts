import {DataSource, Repository} from "typeorm";
import {User} from "./user.entity";
import {ConflictException, Injectable, InternalServerErrorException} from "@nestjs/common";
import {AuthCredentialDto} from "./dto/auth-credential.dto";
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserRepository extends Repository<User>{
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async createUser(authCredentialDto: AuthCredentialDto): Promise<void> {
    const {  email , username, password, phoneNumber, role, vehicleInfo } = authCredentialDto;

    // 비밀번호 암호화 작업
    // 유니크한 salt 생성후 비밀번호와 salt 값을 합쳐서 해쉬된 비밀번호를 얻고 그 비밀번호를 데이터베이스에 저장
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.create({
      email,
      username,
      password: hashedPassword,
      phoneNumber,
      role,
      vehicleModel: vehicleInfo?.model || null,
      licensePlate: vehicleInfo?.licensePlate || null,
      seatingCapacity: vehicleInfo?.seatingCapacity || null,
      points: 0,
    });

    try {
      await this.save(user);
    } catch (error){
      // username 이 중복되어 발생하는 오류코드는 23505이다.
      if (error.code === '23505') {
        throw new ConflictException('Existing username');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

}